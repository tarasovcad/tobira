"use server";

import {createClient} from "@/components/utils/supabase/server";
import {auth} from "@/lib/auth";
import {
  extractDescriptionFromHtml,
  extractTitleFromHtml,
  fetchBrowserlessRenderedHtml,
  fetchTextWithTimeout,
  isHtmlContentType,
  looksLikeChallengeHtml,
  normalizeInputUrl,
} from "@/lib/web-fetch";
import {ALLOWED_MEDIA_DOMAINS} from "@/components/providers/constants";
import {extractXMedia} from "@/lib/media-fetch";
import {headers} from "next/headers";
import {Client} from "@upstash/qstash";
import {randomUUID} from "crypto";
import {createClient as createSupabaseClient, type SupabaseClient} from "@supabase/supabase-js";
export type AddWebsiteBookmarkResult = {
  ok: true;
  url: string;
};

export type AddMediaBookmarkResult = {
  ok: true;
  url: string;
  media?: string[];
};

export type UrlMetadataResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  title?: string;
  description?: string;
};

export type UpdateBookmarkData = {
  title?: string;
  description?: string;
  preview_image?: string;
  notes?: string;
  tags?: string[];
};

const qstash = new Client({
  token: process.env.QSTASH_TOKEN!,
  baseUrl: process.env.QSTASH_URL,
});

export async function fetchUrlMetadata(
  normalized: URL,
  inputUrl: string,
): Promise<UrlMetadataResult> {
  const result: UrlMetadataResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
  };

  // --- Fast path: simple fetch (works for ~95% of sites) ---
  const res = await fetchTextWithTimeout(normalized.toString(), 8000, {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  });
  result.finalUrl = res.url;

  const contentType = res.headers.get("content-type") ?? "";
  if (!isHtmlContentType(contentType)) {
    return result;
  }

  let html = await res.text();
  let usedBrowserless = false;

  // --- Fallback: if the HTML looks like a Cloudflare/bot challenge page,
  //     use Browserless to get the real rendered HTML ---
  if (looksLikeChallengeHtml(html)) {
    try {
      html = await fetchBrowserlessRenderedHtml(normalized.toString());
      usedBrowserless = true;
    } catch {
      // Browserless fallback failed — continue with whatever we got
    }
  }

  result.title = extractTitleFromHtml(html);
  result.description = extractDescriptionFromHtml(html);

  // If title/description are still empty after Browserless, and it still
  // looks like a challenge page, treat as unavailable (don't store garbage)
  if (!usedBrowserless && looksLikeChallengeHtml(html)) {
    result.title = undefined;
    result.description = undefined;
  }

  // Graceful fallback: use the hostname as title when extraction failed
  if (!result.title) {
    result.title = normalized.hostname.replace(/^www\./, "");
  }

  return result;
}

export async function addWebsiteBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "website";
}): Promise<AddWebsiteBookmarkResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid url");
  }

  let metadata: UrlMetadataResult;
  try {
    metadata = await fetchUrlMetadata(normalized, input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Failed to fetch metadata");
  }

  const supabase = await createClient();

  const bookmarkId = randomUUID();

  const {data, error} = await supabase
    .from("bookmarks")
    .insert({
      id: bookmarkId,
      url: normalized.toString(),
      title: metadata.title ?? null,
      user_id: session.user.id,
      description: metadata.description ?? null,
      kind: input.kind ?? "website",
      preview_image: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-previews/${bookmarkId}/preview.png`,
    })
    .select("id")
    .single();

  if (error) throw error;

  // attach tags (bookmark creation should still succeed if tagging fails)
  const tagNames = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));
  if (tagNames.length > 0) {
    const {error: tagsError} = await supabase.rpc("attach_tags_to_bookmark", {
      p_bookmark_id: data.id,
      p_user_id: session.user.id,
      p_tag_names: tagNames,
    });
    if (tagsError) {
      console.error("Failed to attach tags to bookmark:", tagsError);
    }
  }

  // attach to collection if provided
  if (input.collectionId) {
    const {error: collectionError} = await supabase.from("bookmark_collections").insert({
      bookmark_id: data.id,
      collection_id: input.collectionId,
    });
    if (collectionError) {
      console.error("Failed to attach bookmark to collection:", collectionError);
    }
  }

  const receiverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`;

  await qstash.publishJSON({
    url: receiverUrl,
    body: {
      url: normalized.toString(),
      id: data.id,
    },
    idempotencyKey: `bookmark-${data.id}`,
    headers: {
      "x-job-type": "enrich-bookmark",
      "x-version": "v1",
    },
    timeout: 30,
  });

  return {ok: true, url: normalized.toString()};
}

async function processAndUploadMediaImage(
  mediaUrl: string,
  originalUrl: string,
  bookmarkId: string,
  serviceRoleSupabase: SupabaseClient,
): Promise<string> {
  if (mediaUrl === originalUrl) {
    return mediaUrl;
  }

  try {
    const imageRes = await fetch(mediaUrl);
    if (!imageRes.ok) return mediaUrl;

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "jpg";
    const filePath = `${bookmarkId}/media.${extension}`;

    const {error: uploadError} = await serviceRoleSupabase.storage
      .from("bookmark-media")
      .upload(filePath, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error("Failed to upload to Supabase storage:", uploadError);
      return mediaUrl;
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bookmark-media/${filePath}`;
  } catch (err) {
    console.error("Failed to fetch image for storage:", err);
    return mediaUrl;
  }
}

async function attachBookmarkTags(
  supabase: SupabaseClient,
  bookmarkId: string,
  userId: string,
  tags?: string[],
) {
  const tagNames = (tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}));

  if (tagNames.length === 0) return;

  const {error} = await supabase.rpc("attach_tags_to_bookmark", {
    p_bookmark_id: bookmarkId,
    p_user_id: userId,
    p_tag_names: tagNames,
  });

  if (error) {
    console.error("Failed to attach tags to bookmark:", error);
  }
}

export async function addMediaBookmark(input: {
  url: string;
  tags?: string[];
  collectionId?: string;
  kind: "media";
  selectedMediaUrls?: string[];
}): Promise<AddMediaBookmarkResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");
  if (input.kind !== "media") throw new Error("Invalid kind");

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(input.url);
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : "Invalid url");
  }

  const hostname = normalized.hostname;
  const isAllowedDomain = ALLOWED_MEDIA_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!isAllowedDomain) {
    throw new Error("Domain not supported for media bookmarks");
  }

  const isXDomain = ["x.com", "twitter.com", "www.x.com", "www.twitter.com"].includes(hostname);

  if (!isXDomain) {
    throw new Error("Only X (Twitter) URLs are currently supported for media bookmarks.");
  }

  let mediaUrls: string[] = [];

  const extractedMetadata = await extractXMedia(normalized.toString());

  if (extractedMetadata?.hasMedia === false) {
    throw new Error("This post has no media. Please save it as a Website bookmark instead.");
  }

  if (Array.isArray(extractedMetadata?.mediaURLs)) {
    mediaUrls = extractedMetadata.mediaURLs;
  }

  // Prompt user if multiple media options exist and none selected
  if (!input.selectedMediaUrls && mediaUrls.length > 1) {
    return {ok: true, url: input.url, media: mediaUrls};
  }

  const urlsToCreate = input.selectedMediaUrls?.length
    ? input.selectedMediaUrls
    : mediaUrls.length > 0
      ? mediaUrls
      : [input.url];

  const supabase = await createClient();
  const serviceRoleSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const processedItems = await Promise.all(
    urlsToCreate.map(async (mediaUrl) => {
      const bookmarkId = randomUUID();
      const previewImage = await processAndUploadMediaImage(
        mediaUrl,
        input.url,
        bookmarkId,
        serviceRoleSupabase,
      );
      return {bookmarkId, previewImage};
    }),
  );

  const bookmarksToInsert = processedItems.map(({bookmarkId, previewImage}) => ({
    id: bookmarkId,
    url: normalized.toString(),
    title: extractedMetadata?.text || null,
    user_id: session.user.id,
    kind: "media",
    preview_image: previewImage,
    metadata: extractedMetadata || null,
  }));

  const {error: insertError} = await supabase.from("bookmarks").insert(bookmarksToInsert);

  if (insertError) {
    console.error("Error creating media bookmarks:", insertError);
    throw insertError;
  }

  if (input.collectionId) {
    const collectionsToInsert = processedItems.map(({bookmarkId}) => ({
      bookmark_id: bookmarkId,
      collection_id: input.collectionId,
    }));

    const {error: collectionError} = await supabase
      .from("bookmark_collections")
      .insert(collectionsToInsert);

    if (collectionError) {
      console.error("Failed to attach bookmarks to collection:", collectionError);
    }
  }

  if (input.tags && input.tags.length > 0) {
    await Promise.all(
      processedItems.map(({bookmarkId}) =>
        attachBookmarkTags(supabase, bookmarkId, session.user.id, input.tags),
      ),
    );
  }

  return {ok: true, url: input.url, media: mediaUrls};
}

export async function updateBookmark(
  bookmarkId: string,
  updates: UpdateBookmarkData,
): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const hasTagUpdate = updates.tags !== undefined;

  // Only include fields that are actually present in the updates object
  const updateData: Record<string, string> = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.preview_image !== undefined) updateData.preview_image = updates.preview_image;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  // If no fields to update, return early
  if (Object.keys(updateData).length === 0 && !hasTagUpdate) {
    return {ok: true};
  }

  const supabase = await createClient();

  // Update bookmark fields
  const {error: updateError} = await supabase
    .from("bookmarks")
    .update({...updateData, updated_at: new Date().toISOString()})
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id);

  if (updateError) throw updateError;

  if (hasTagUpdate) {
    const {error: tagError} = await supabase.rpc("sync_bookmark_tags", {
      p_bookmark_id: bookmarkId,
      p_user_id: session.user.id,
      p_tag_names: updates.tags ?? [],
    });
    if (tagError) throw tagError;
  }

  return {ok: true};
}

export async function deleteBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update({deleted_at: new Date().toISOString()})
    .in("id", ids)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function archiveBookmarks(bookmarkIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(bookmarkIds) ? bookmarkIds : [bookmarkIds];

  const supabase = await createClient();

  const {error} = await supabase
    .from("bookmarks")
    .update({archived_at: new Date().toISOString(), updated_at: new Date().toISOString()})
    .in("id", ids)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function resetBookmark(bookmarkId: string): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  // Look up the bookmark to get its URL
  const {data: bookmark, error: fetchError} = await supabase
    .from("bookmarks")
    .select("id, url")
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id)
    .single();

  if (fetchError || !bookmark) {
    throw new Error("Bookmark not found");
  }

  // Re-fetch metadata (title, description) from the original URL
  const normalized = normalizeInputUrl(bookmark.url);
  const metadata = await fetchUrlMetadata(normalized, bookmark.url);

  // Update the bookmark row with fresh metadata
  const {error: updateError} = await supabase
    .from("bookmarks")
    .update({
      title: metadata.title ?? null,
      description: metadata.description ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookmarkId)
    .eq("user_id", session.user.id);

  if (updateError) throw updateError;

  // Queue a QStash job to re-fetch favicon, OG image, and screenshot
  const receiverUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/enrich-bookmark`;

  await qstash.publishJSON({
    url: receiverUrl,
    body: {
      url: normalized.toString(),
      id: bookmark.id,
    },
    headers: {
      "x-job-type": "enrich-bookmark",
      "x-version": "v1",
    },
    timeout: 30,
  });

  return {ok: true};
}
