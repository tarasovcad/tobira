# Website Bookmark Creation Flow

This is the path for creating a `website` bookmark: from the add-bookmark UI, through the database, QStash, enrichment, `website_records`, and error handling.

```mermaid
flowchart TD
  A["User submits website URL"] --> B["useAddBookmarkFlow"]
  B --> C["addWebsiteBookmark server action"]
  C --> D["Require authenticated user"]
  D --> E["Rate limit website bookmark creation"]
  E --> F["Normalize and validate URL"]

  F --> G["createWebsiteBookmark"]
  G --> H["Hash normalized URL into websiteRecordKey"]
  H --> I{"Fresh reusable website_records row?"}

  I -->|"yes, fresh"| J["Insert bookmarks row with title, description, images, websiteRecordKey"]
  J --> K["Attach tags and collection"]
  K --> L["Return success"]
  L --> M["UI shows toast and invalidates bookmark queries"]

  I -->|"no or partly fresh"| N["Insert bookmarks row as pending or partial"]
  N --> O["Attach tags and collection"]
  O --> P["Publish QStash job"]
  P --> Q["/api/process-website-bookmark"]
  Q --> R["Verify QStash signature and read bookmark id"]
  R --> S["processWebsiteBookmark"]
  S --> T["Load active website bookmark"]
  T --> U["Fetch website HTML"]
  U --> V["Extract title and description"]
  V --> W["Immediately update bookmark text metadata"]
  W --> X["Process favicon, OG image, and screenshot"]
  X --> Y["Upload ready assets to R2"]
  Y --> Z["Upsert website_records"]
  Z --> AA["Update bookmarks row from website_records"]
  AA --> AB["UI refetch sees ready, missing, or failed statuses"]

  P -->|"publish fails"| PF["Log queue error"]
  PF --> PG["Delete just-created bookmark"]
  PG --> PH["Throw error to UI"]

  R -->|"bad signature or missing id"| RE["Return 401 or 400"]
  U -->|"HTML fetch fails"| HF["Mark bookmark text and images failed"]
  HF --> HH["Return 500 so QStash can retry"]
  X -->|"single asset fails"| AF["Mark that asset failed"]
  AF --> Z
```

## Main Creation Path

1. The UI calls `addWebsiteBookmark` from `useAddBookmarkFlow` and closes the dialog.
2. The server action checks login, applies rate limiting, normalizes the URL, and rejects invalid/non-website URLs.
3. `createWebsiteBookmark` hashes the normalized URL into a stable `websiteRecordKey`.
4. It checks `website_records` for a reusable record.
5. It inserts a row in `bookmarks`.
6. It attaches tags and collection if provided.
7. If the existing `website_records` data is fully fresh, the bookmark is done immediately.
8. If data is missing, stale, or only partly fresh, it queues QStash to enrich the bookmark in the background.

## website_records

`website_records` is the shared cache for a normalized URL. It stores:

- `key`: hash of the normalized URL.
- `normalized_url` and `hostname`.
- `title` and `description`.
- `images`: favicon, OG image, and preview screenshot info.
- `html_status` and `preview_status`: `ready`, `missing`, or `failed`.
- refresh timestamps that decide whether the record can be reused.

When a fresh record exists, new bookmarks can reuse its title, description, and images without waiting for QStash.

## Pending Bookmark State

When no fresh record exists, the bookmark is still created right away.

- `metadata.textMetadataStatus` is set to `pending` unless fresh HTML metadata was reused.
- image statuses are `pending` with deterministic R2 keys.
- the UI refetches pending bookmarks until processing finishes.

## QStash Enrichment

QStash posts `{ id: bookmarkId }` to this route, with two retries configured:

`/api/process-website-bookmark`

That route:

1. verifies the Upstash signature,
2. reads the bookmark id,
3. fetches the current bookmark,
4. fetches the website HTML,
5. extracts title/description,
6. immediately updates the original `bookmarks` row with title, description, and `metadata.textMetadataStatus`,
7. processes favicon, OG image, and screenshot,
8. uploads ready assets to R2,
9. upserts `website_records`,
10. updates the original `bookmarks` row from the record.

## Updates After Processing

After text metadata extraction succeeds, `bookmarks` is updated immediately with:

- title and description, but only if the bookmark does not already have them
- `metadata.textMetadataStatus` set to `ready` or `missing`
- `updated_at`

After asset processing succeeds, `bookmarks` is updated again from `website_records` with:

- `website_record_key`
- title and description, but only if the bookmark does not already have them
- images from `website_records`, while preserving the user's selected image type when possible
- `metadata.textMetadataStatus` from the record's HTML status
- `updated_at`

## Error Paths

- Invalid URL: server action throws before creating a bookmark.
- Rate limit or auth failure: server action stops before creating a bookmark.
- QStash publish failure: the just-created bookmark is deleted and an error is thrown.
- Bad QStash signature: process route returns `401`.
- Missing QStash id: process route returns `400`.
- HTML fetch failure: bookmark text/images are marked `failed`, then the route returns `500` so QStash can retry.
- Single asset failure: that asset becomes `failed`, the rest can still be saved and the bookmark still updates.
- Bookmark deleted during processing: processor stops and does not update it.

## Main Files

- `app/src/features/add-item/_hooks/use-add-bookmark-flow.ts`
- `app/src/app/actions/bookmarks/create.ts`
- `app/src/lib/bookmarks/website/create.ts`
- `app/src/lib/bookmarks/website/queue.ts`
- `app/src/app/api/(process)/process-website-bookmark/route.ts`
- `app/src/lib/bookmarks/website/job-request.ts`
- `app/src/lib/bookmarks/website/process.ts`
- `app/src/lib/bookmarks/website/records.ts`
- `app/src/lib/bookmarks/website/assets.ts`
- `app/src/lib/bookmarks/website/status-updates.ts`
- `app/src/db/schema.ts`
