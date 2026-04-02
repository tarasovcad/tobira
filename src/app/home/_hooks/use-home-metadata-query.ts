import {queryOptions, useQuery} from "@tanstack/react-query";
import {getCollections, type Collection} from "@/app/actions/collections";
import {getSidebarTags} from "@/app/actions/tags";
import type {SidebarTag} from "../_types";

export const homeMetadataKeys = {
  collectionsRoot: ["collections"] as const,
  collections: (userId?: string | null) => ["collections", userId ?? null] as const,
  tagsRoot: ["tags"] as const,
  tags: (userId?: string | null) => ["tags", userId ?? null] as const,
};

export function collectionsQueryOptions(userId?: string | null) {
  return queryOptions({
    queryKey: homeMetadataKeys.collections(userId),
    queryFn: async () => {
      if (!userId) return [];
      return await getCollections(userId);
    },
  });
}

export function tagsQueryOptions(userId?: string | null) {
  return queryOptions({
    queryKey: homeMetadataKeys.tags(userId),
    queryFn: async () => {
      if (!userId) return [];
      return await getSidebarTags(userId);
    },
  });
}

export function useCollectionsQuery({
  userId,
  initialData,
  enabled,
}: {
  userId?: string | null;
  initialData?: Collection[];
  enabled?: boolean;
} = {}) {
  return useQuery({
    ...collectionsQueryOptions(userId),
    initialData,
    enabled,
  });
}

export function useTagsQuery({
  userId,
  initialData,
  enabled,
}: {
  userId?: string | null;
  initialData?: SidebarTag[];
  enabled?: boolean;
} = {}) {
  return useQuery({
    ...tagsQueryOptions(userId),
    initialData,
    enabled,
  });
}
