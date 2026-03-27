"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {createClient} from "@/components/utils/supabase/server";
import {TagWithCount} from "../home/_types";

export async function generateAiSuggestions() {
  return {
    suggestions: ["react", "nextjs", "typescript", "tailwind", "ui"],
  };
}

export async function getTags() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const supabase = await createClient();
  const {data, error} = await supabase.rpc("get_tags_with_counts", {p_user_id: session.user.id});

  if (error) {
    console.error("Failed to fetch tags with counts:", error);
    return [];
  }

  return ((data ?? []) as TagWithCount[]).map((t) => ({
    id: t.id,
    name: t.name,
    count: typeof t.count === "string" ? Number(t.count) : (t.count ?? 0),
    description: t.description,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));
}

export async function deleteTags(tagIds: string | string[]): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const ids = Array.isArray(tagIds) ? tagIds : [tagIds];

  const supabase = await createClient();

  const {error} = await supabase.from("tags").delete().in("id", ids).eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}

export async function updateTag(
  tagId: string,
  data: {name: string; description?: string},
): Promise<{ok: true}> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();

  const {error} = await supabase
    .from("tags")
    .update({name: data.name, description: data.description ?? null})
    .eq("id", tagId)
    .eq("user_id", session.user.id);

  if (error) throw error;

  return {ok: true};
}
