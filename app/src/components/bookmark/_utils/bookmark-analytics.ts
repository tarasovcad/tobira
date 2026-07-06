import type {Bookmark} from "@/components/bookmark/types";
import type {BookmarkKind, BookmarkKindCounts} from "@/lib/analytics/events";

type BookmarkKindSource = Pick<Bookmark, "kind">;

export function getBookmarkErrorCode(error: unknown) {
  if (!(error instanceof Error)) return "unknown";

  const message = error.message.toLowerCase();

  if (message.includes("unauthorized")) return "unauthorized";
  if (message.includes("too many")) return "rate_limited";
  if (message.includes("queue")) return "queue_failed";
  if (
    message.includes("not supported") ||
    message.includes("currently supported") ||
    message.includes("no media")
  ) {
    return "unsupported_url";
  }
  if (message.includes("invalid") || message.includes("url")) return "invalid_url";
  if (message.includes("not found")) return "not_found";
  if (message.includes("still being saved")) return "optimistic_bookmark";

  return "unknown";
}

export function getBookmarkKindCounts(bookmarks: BookmarkKindSource[]): BookmarkKindCounts {
  return bookmarks.reduce<BookmarkKindCounts>(
    (counts, bookmark) => {
      counts[bookmark.kind] += 1;
      return counts;
    },
    {website: 0, media: 0, post: 0},
  );
}

export function getBookmarkActionProperties(bookmarks: BookmarkKindSource[]) {
  return {
    count: bookmarks.length,
    kind_counts: getBookmarkKindCounts(bookmarks),
  };
}

export function getBookmarksByIds(bookmarks: Bookmark[], ids: string[]) {
  const idSet = new Set(ids);
  return bookmarks.filter((bookmark) => idSet.has(bookmark.id));
}

export function getBookmarkActionPropertiesFromStats(stats: {
  all: number;
  websites: number;
  media: number;
  posts: number;
}) {
  return {
    count: stats.all,
    kind_counts: {
      website: stats.websites,
      media: stats.media,
      post: stats.posts,
    } satisfies Record<BookmarkKind, number>,
  };
}
