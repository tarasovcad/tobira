import {
  pgTable,
  index,
  foreignKey,
  uuid,
  text,
  timestamp,
  boolean,
  unique,
  jsonb,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm";

export const bookmarkKind = pgEnum("Bookmark kind", ["website", "image", "media"]);

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
