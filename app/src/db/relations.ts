import {relations} from "drizzle-orm";
import {
  user,
  collections,
  session,
  bookmarks,
  account,
  tags,
  bookmarkCollections,
  bookmarkTags,
  syncConnections,
  syncItems,
  syncRuns,
  syncEvents,
  syncItemBookmarkLinks,
} from "./schema";

export const collectionsRelations = relations(collections, ({one, many}) => ({
  user: one(user, {
    fields: [collections.userId],
    references: [user.id],
  }),
  bookmarkCollections: many(bookmarkCollections),
  syncConnections: many(syncConnections),
}));

export const userRelations = relations(user, ({many}) => ({
  collections: many(collections),
  sessions: many(session),
  bookmarks: many(bookmarks),
  accounts: many(account),
  tags: many(tags),
  syncConnections: many(syncConnections),
  syncItems: many(syncItems),
  syncRuns: many(syncRuns),
  syncEvents: many(syncEvents),
}));

export const sessionRelations = relations(session, ({one}) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const bookmarksRelations = relations(bookmarks, ({one, many}) => ({
  user: one(user, {
    fields: [bookmarks.userId],
    references: [user.id],
  }),
  bookmarkCollections: many(bookmarkCollections),
  bookmarkTags: many(bookmarkTags),
  syncItemBookmarkLink: one(syncItemBookmarkLinks),
}));

export const accountRelations = relations(account, ({one}) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const tagsRelations = relations(tags, ({one, many}) => ({
  user: one(user, {
    fields: [tags.userId],
    references: [user.id],
  }),
  bookmarkTags: many(bookmarkTags),
}));

export const syncConnectionsRelations = relations(syncConnections, ({one, many}) => ({
  user: one(user, {
    fields: [syncConnections.userId],
    references: [user.id],
  }),
  defaultCollection: one(collections, {
    fields: [syncConnections.defaultCollectionId],
    references: [collections.id],
  }),
  syncItems: many(syncItems),
  syncRuns: many(syncRuns),
  syncEvents: many(syncEvents),
}));

export const syncItemsRelations = relations(syncItems, ({one, many}) => ({
  user: one(user, {
    fields: [syncItems.userId],
    references: [user.id],
  }),
  connection: one(syncConnections, {
    fields: [syncItems.connectionId],
    references: [syncConnections.id],
  }),
  importedByRun: one(syncRuns, {
    fields: [syncItems.importedByRunId],
    references: [syncRuns.id],
  }),
  syncEvents: many(syncEvents),
  syncItemBookmarkLink: one(syncItemBookmarkLinks),
}));

export const syncRunsRelations = relations(syncRuns, ({one, many}) => ({
  user: one(user, {
    fields: [syncRuns.userId],
    references: [user.id],
  }),
  connection: one(syncConnections, {
    fields: [syncRuns.connectionId],
    references: [syncConnections.id],
  }),
  importedItems: many(syncItems),
  syncEvents: many(syncEvents),
}));

export const syncEventsRelations = relations(syncEvents, ({one}) => ({
  user: one(user, {
    fields: [syncEvents.userId],
    references: [user.id],
  }),
  connection: one(syncConnections, {
    fields: [syncEvents.connectionId],
    references: [syncConnections.id],
  }),
  run: one(syncRuns, {
    fields: [syncEvents.runId],
    references: [syncRuns.id],
  }),
  syncItem: one(syncItems, {
    fields: [syncEvents.syncItemId],
    references: [syncItems.id],
  }),
}));

export const syncItemBookmarkLinksRelations = relations(syncItemBookmarkLinks, ({one}) => ({
  syncItem: one(syncItems, {
    fields: [syncItemBookmarkLinks.syncItemId],
    references: [syncItems.id],
  }),
  bookmark: one(bookmarks, {
    fields: [syncItemBookmarkLinks.bookmarkId],
    references: [bookmarks.id],
  }),
}));

export const bookmarkCollectionsRelations = relations(bookmarkCollections, ({one}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkCollections.bookmarkId],
    references: [bookmarks.id],
  }),
  collection: one(collections, {
    fields: [bookmarkCollections.collectionId],
    references: [collections.id],
  }),
}));

export const bookmarkTagsRelations = relations(bookmarkTags, ({one}) => ({
  bookmark: one(bookmarks, {
    fields: [bookmarkTags.bookmarkId],
    references: [bookmarks.id],
  }),
  tag: one(tags, {
    fields: [bookmarkTags.tagId],
    references: [tags.id],
  }),
}));
