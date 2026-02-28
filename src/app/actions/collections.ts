"use server";

import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {createClient} from "@/components/utils/supabase/server";

export type Collection = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  created_at: string;
};

export async function getCollections(): Promise<Collection[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const supabase = await createClient();
  const {data, error} = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", {ascending: false});

  if (error) {
    console.error("Failed to fetch collections:", error);
    return [];
  }

  return data as Collection[];
}

export async function createCollection(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const {data: newCollection, error} = await supabase
    .from("collections")
    .insert([
      {
        ...data,
        user_id: session.user.id,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return newCollection as Collection;
}

export async function deleteCollections(ids: string | string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const idsArray = Array.isArray(ids) ? ids : [ids];

  const supabase = await createClient();
  const {error} = await supabase
    .from("collections")
    .delete()
    .in("id", idsArray)
    .eq("user_id", session.user.id);

  if (error) throw error;
  return true;
}

export async function updateCollection(
  id: string,
  data: {
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const supabase = await createClient();
  const {data: updatedCollection, error} = await supabase
    .from("collections")
    .update(data)
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) throw error;

  return updatedCollection as Collection;
}
