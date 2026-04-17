import {
  pgTable,
  index,
  foreignKey,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  unique,
  jsonb,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";

export const bookmarkKind = pgEnum("Bookmark kind", ["website", "image", "media", "post"]);
export const syncProvider = pgEnum("sync_provider", [
  "x",
  "reddit",
  "dribbble",
  "chrome",
  "arc",
  "dia",
  "pinterest",
  "youtube",
  "firefox",
  "safari",
]);
export const syncConnectionMethod = pgEnum("sync_connection_method", [
  "oauth",
  "extension",
  "cookies",
  "export",
  "har",
]);
export const syncConnectionStatus = pgEnum("sync_connection_status", [
  "healthy",
  "syncing",
  "warning",
  "error",
  "paused",
  "disconnected",
]);
export const syncMode = pgEnum("sync_mode", ["automatic", "once"]);
export const syncDeletedSourceBehavior = pgEnum("sync_deleted_source_behavior", ["keep", "remove"]);
export const syncItemStatus = pgEnum("sync_item_status", [
  "active",
  "duplicate",
  "skipped",
  "removed_from_source",
  "failed",
  "promoted",
]);
export const syncRunTrigger = pgEnum("sync_run_trigger", [
  "manual",
  "scheduled",
  "initial_connect",
  "reconnect",
  "retry",
]);
export const syncRunStatus = pgEnum("sync_run_status", [
  "queued",
  "running",
  "success",
  "partial_success",
  "failed",
  "cancelled",
]);
export const syncEventLevel = pgEnum("sync_event_level", ["info", "success", "warning", "error"]);

export const collections = pgTable(
  "collections",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    description: text(),
    color: text(),
    icon: text(),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true, mode: "string"}).defaultNow(),
    isPinned: boolean("is_pinned").default(false),
  },
  (table) => [
    index("idx_collections_is_pinned").using(
      "btree",
      table.isPinned.asc().nullsLast().op("bool_ops"),
    ),
    index("idx_collections_sidebar_state").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.isPinned.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "collections_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp({withTimezone: true, mode: "string"}).notNull(),
    token: text().notNull(),
    createdAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({withTimezone: true, mode: "string"}).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: text().notNull(),
  },
  (table) => [
    index("session_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_userId_fkey",
    }).onDelete("cascade"),
    unique("session_token_key").on(table.token),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    aiContext: text(),
    enableAiOptimization: boolean().default(true),

    createdAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [unique("user_email_key").on(table.email)],
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
    title: text(),
    description: text(),
    url: text().notNull(),
    userId: text("user_id").notNull(),
    kind: bookmarkKind(),
    previewImage: text("preview_image"),
    archivedAt: timestamp("archived_at", {withTimezone: true, mode: "string"}),
    deletedAt: timestamp("deleted_at", {withTimezone: true, mode: "string"}),
    updatedAt: timestamp("updated_at", {withTimezone: true, mode: "string"}).defaultNow(),
    notes: text(),
    metadata: jsonb().default({}),
  },
  (table) => [
    index("bookmarks_active_feed_idx")
      .on(table.userId, table.kind, table.createdAt.desc())
      .where(sql`archived_at IS NULL AND deleted_at IS NULL`),
    index("bookmarks_user_active_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
      table.archivedAt.asc().nullsLast().op("text_ops"),
      table.deletedAt.asc().nullsLast().op("text_ops"),
      table.id.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "bookmarks_user_id_fkey",
    })
      .onUpdate("cascade")
      .onDelete("cascade"),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({withTimezone: true, mode: "string"}).notNull(),
    createdAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({withTimezone: true, mode: "string"}),
    refreshTokenExpiresAt: timestamp({withTimezone: true, mode: "string"}),
    scope: text(),
    password: text(),
    createdAt: timestamp({withTimezone: true, mode: "string"})
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({withTimezone: true, mode: "string"}).notNull(),
  },
  (table) => [
    index("account_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_userId_fkey",
    }).onDelete("cascade"),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    name: text().notNull(),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
    description: text(),
    isPinned: boolean("is_pinned").default(false),
  },
  (table) => [
    index("idx_tags_is_pinned").using("btree", table.isPinned.asc().nullsLast().op("bool_ops")),
    index("idx_tags_sidebar_state").using(
      "btree",
      table.userId.asc().nullsLast().op("bool_ops"),
      table.isPinned.asc().nullsLast().op("bool_ops"),
    ),
    index("tags_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "tags_user_id_fkey",
    }).onDelete("cascade"),
    unique("tags_user_id_name_key").on(table.userId, table.name),
  ],
);

export const syncConnections = pgTable(
  "sync_connections",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    provider: syncProvider().notNull(),
    method: syncConnectionMethod().notNull(),
    status: syncConnectionStatus().default("healthy").notNull(),
    syncMode: syncMode("sync_mode").default("automatic").notNull(),
    deletedSourceBehavior: syncDeletedSourceBehavior("deleted_source_behavior")
      .default("keep")
      .notNull(),
    externalAccountId: text("external_account_id").notNull(),
    externalUsername: text("external_username"),
    externalDisplayName: text("external_display_name"),
    externalAvatarUrl: text("external_avatar_url"),
    label: text().notNull(),
    skipDuplicates: boolean("skip_duplicates").default(true).notNull(),
    notifyOnCompletion: boolean("notify_on_completion").default(true).notNull(),
    defaultCollectionId: uuid("default_collection_id"),
    providerSettings: jsonb("provider_settings").default({}).notNull(),
    checkpoint: jsonb().default({}).notNull(),
    lastErrorCode: text("last_error_code"),
    lastErrorMessage: text("last_error_message"),
    statusChangedAt: timestamp("status_changed_at", {withTimezone: true, mode: "string"})
      .defaultNow()
      .notNull(),
    lastSyncedAt: timestamp("last_synced_at", {withTimezone: true, mode: "string"}),
    lastSuccessfulSyncAt: timestamp("last_successful_sync_at", {
      withTimezone: true,
      mode: "string",
    }),
    nextSyncAt: timestamp("next_sync_at", {withTimezone: true, mode: "string"}),
    disabledAt: timestamp("disabled_at", {withTimezone: true, mode: "string"}),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
  },
  (table) => [
    index("sync_connections_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    index("sync_connections_user_status_provider_idx").on(
      table.userId,
      table.status,
      table.provider,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sync_connections_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.defaultCollectionId],
      foreignColumns: [collections.id],
      name: "sync_connections_default_collection_id_fkey",
    }).onDelete("set null"),
    unique("sync_connections_user_provider_external_account_key").on(
      table.userId,
      table.provider,
      table.externalAccountId,
    ),
  ],
);

export const syncItems = pgTable(
  "sync_items",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    importedByRunId: uuid("imported_by_run_id"),
    externalId: text("external_id").notNull(),
    externalUrl: text("external_url").notNull(),
    canonicalUrl: text("canonical_url").notNull(),
    title: text(),
    description: text(),
    previewImage: text("preview_image"),
    kind: bookmarkKind().notNull(),
    status: syncItemStatus().default("active").notNull(),
    dedupeKey: text("dedupe_key"),
    metadata: jsonb().default({}).notNull(),
    sourceCreatedAt: timestamp("source_created_at", {withTimezone: true, mode: "string"}),
    sourceUpdatedAt: timestamp("source_updated_at", {withTimezone: true, mode: "string"}),
    importedAt: timestamp("imported_at", {withTimezone: true, mode: "string"})
      .defaultNow()
      .notNull(),
    lastSeenAt: timestamp("last_seen_at", {withTimezone: true, mode: "string"})
      .defaultNow()
      .notNull(),
    removedFromSourceAt: timestamp("removed_from_source_at", {
      withTimezone: true,
      mode: "string",
    }),
    isPromoted: boolean("is_promoted").default(false).notNull(),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
  },
  (table) => [
    index("sync_items_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    index("sync_items_imported_by_run_id_idx").on(table.importedByRunId),
    index("sync_items_connection_imported_idx").on(table.connectionId, table.importedAt.desc()),
    index("sync_items_connection_status_imported_idx").on(
      table.connectionId,
      table.status,
      table.importedAt.desc(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sync_items_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.connectionId],
      foreignColumns: [syncConnections.id],
      name: "sync_items_connection_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.importedByRunId],
      foreignColumns: [syncRuns.id],
      name: "sync_items_imported_by_run_id_fkey",
    }).onDelete("set null"),
    unique("sync_items_connection_external_id_key").on(table.connectionId, table.externalId),
  ],
);

export const syncRuns = pgTable(
  "sync_runs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    trigger: syncRunTrigger().notNull(),
    status: syncRunStatus().notNull(),
    itemsDiscovered: integer("items_discovered").default(0).notNull(),
    itemsCreated: integer("items_created").default(0).notNull(),
    itemsUpdated: integer("items_updated").default(0).notNull(),
    itemsSkipped: integer("items_skipped").default(0).notNull(),
    duplicatesSkipped: integer("duplicates_skipped").default(0).notNull(),
    itemsRemoved: integer("items_removed").default(0).notNull(),
    itemsFailed: integer("items_failed").default(0).notNull(),
    startedAt: timestamp("started_at", {withTimezone: true, mode: "string"}),
    finishedAt: timestamp("finished_at", {withTimezone: true, mode: "string"}),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    cursorBefore: jsonb("cursor_before"),
    cursorAfter: jsonb("cursor_after"),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
  },
  (table) => [
    index("sync_runs_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    index("sync_runs_user_created_at_idx").on(table.userId, table.createdAt.desc()),
    index("sync_runs_connection_id_idx").on(table.connectionId),
    index("sync_runs_connection_created_at_idx").on(table.connectionId, table.createdAt.desc()),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sync_runs_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.connectionId],
      foreignColumns: [syncConnections.id],
      name: "sync_runs_connection_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const syncEvents = pgTable(
  "sync_events",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    connectionId: uuid("connection_id").notNull(),
    runId: uuid("run_id"),
    syncItemId: uuid("sync_item_id"),
    level: syncEventLevel().notNull(),
    code: text().notNull(),
    title: text().notNull(),
    message: text().notNull(),
    details: jsonb().default({}).notNull(),
    requiresAction: boolean("requires_action").default(false).notNull(),
    resolvedAt: timestamp("resolved_at", {withTimezone: true, mode: "string"}),
    dismissedAt: timestamp("dismissed_at", {withTimezone: true, mode: "string"}),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
  },
  (table) => [
    index("sync_events_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
    index("sync_events_user_created_at_idx").on(table.userId, table.createdAt.desc()),
    index("sync_events_connection_id_idx").on(table.connectionId),
    index("sync_events_run_id_idx").on(table.runId),
    index("sync_events_sync_item_id_idx").on(table.syncItemId),
    index("sync_events_user_attention_idx")
      .on(table.userId, table.createdAt.desc())
      .where(sql`requires_action = true AND resolved_at IS NULL AND dismissed_at IS NULL`),
    index("sync_events_connection_created_at_idx").on(table.connectionId, table.createdAt.desc()),
    index("sync_events_attention_idx")
      .on(table.connectionId, table.createdAt.desc())
      .where(sql`requires_action = true AND resolved_at IS NULL AND dismissed_at IS NULL`),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "sync_events_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.connectionId],
      foreignColumns: [syncConnections.id],
      name: "sync_events_connection_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.runId],
      foreignColumns: [syncRuns.id],
      name: "sync_events_run_id_fkey",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.syncItemId],
      foreignColumns: [syncItems.id],
      name: "sync_events_sync_item_id_fkey",
    }).onDelete("set null"),
  ],
);

export const syncItemBookmarkLinks = pgTable(
  "sync_item_bookmark_links",
  {
    syncItemId: uuid("sync_item_id").notNull(),
    bookmarkId: uuid("bookmark_id").notNull(),
    promotedAt: timestamp("promoted_at", {withTimezone: true, mode: "string"})
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.syncItemId],
      foreignColumns: [syncItems.id],
      name: "sync_item_bookmark_links_sync_item_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmarks.id],
      name: "sync_item_bookmark_links_bookmark_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.syncItemId, table.bookmarkId],
      name: "sync_item_bookmark_links_pkey",
    }),
    unique("sync_item_bookmark_links_sync_item_id_key").on(table.syncItemId),
    unique("sync_item_bookmark_links_bookmark_id_key").on(table.bookmarkId),
  ],
);

export const bookmarkCollections = pgTable(
  "bookmark_collections",
  {
    bookmarkId: uuid("bookmark_id").notNull(),
    collectionId: uuid("collection_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmarks.id],
      name: "bookmark_collections_bookmark_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.collectionId],
      foreignColumns: [collections.id],
      name: "bookmark_collections_collection_id_fkey",
    }).onDelete("cascade"),
    primaryKey({
      columns: [table.collectionId, table.bookmarkId],
      name: "bookmark_collections_pkey",
    }),
  ],
);

export const bookmarkTags = pgTable(
  "bookmark_tags",
  {
    bookmarkId: uuid("bookmark_id").notNull(),
    tagId: uuid("tag_id").notNull(),
    createdAt: timestamp("created_at", {withTimezone: true, mode: "string"}).defaultNow().notNull(),
  },
  (table) => [
    index("bookmark_tags_bookmark_id_idx").using(
      "btree",
      table.bookmarkId.asc().nullsLast().op("uuid_ops"),
    ),
    index("bookmark_tags_tag_id_idx").using("btree", table.tagId.asc().nullsLast().op("uuid_ops")),
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmarks.id],
      name: "bookmark_tags_bookmark_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
      name: "bookmark_tags_tag_id_fkey",
    }).onDelete("cascade"),
    primaryKey({columns: [table.tagId, table.bookmarkId], name: "bookmark_tags_pkey"}),
  ],
);
