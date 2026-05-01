export type VxTwitterMediaItem = {
  altText: string | null;
  duration_millis: number;
  id_str: string;
  size: {height: number; width: number} | null;
  thumbnail_url: string;
  type: "photo" | "video" | "gif";
  url: string;
};

export type VxTwitterPost = {
  tweetID: string;
  conversationID: string;
  text: string;
  date: string;
  date_epoch: number;
  user_name: string;
  user_screen_name: string;
  user_profile_image_url: string;
  likes: number;
  retweets: number;
  replies: number;
  lang: string;
  hashtags: string[];
  hasMedia: boolean;
  mediaURLs: string[];
  media_extended: VxTwitterMediaItem[];
  possibly_sensitive: boolean;
  qrt: VxTwitterPost | null;
  qrtURL: string | null;
  replyingTo: string | null;
  replyingToID: string | null;
};

function extractTweetId(url: string): string | null {
  try {
    const u = new URL(url);
    const pathParts = u.pathname.split("/").filter(Boolean);
    const statusIndex = pathParts.indexOf("status");
    if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
      return pathParts[statusIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchXPostData(url: string): Promise<VxTwitterPost> {
  const tweetId = extractTweetId(url);
  if (!tweetId) {
    throw new Error("Invalid X/Twitter URL — could not extract tweet ID");
  }

  const apiUrl = `https://api.vxtwitter.com/Twitter/status/${tweetId}`;
  const res = await fetch(apiUrl, {cache: "no-store"});

  if (!res.ok) {
    throw new Error(`vxtwitter API error: ${res.status} ${res.statusText}`);
  }

  const text = await res.text();
  let data: VxTwitterPost;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("vxtwitter returned a non-JSON response (possible Cloudflare block)");
  }

  return data;
}
