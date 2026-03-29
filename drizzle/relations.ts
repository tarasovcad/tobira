import {relations} from "drizzle-orm/relations";
import {
  user,
  collections,
  session,
  bookmarks,
  account,
  tags,
  bookmarkCollections,
  bookmarkTags,
} from "../src/db/schema";

export const collectionsRelations = relations(collections, ({one, many}) => ({
  user: one(user, {
    fields: [collections.userId],
    references: [user.id],
  }),
  bookmarkCollections: many(bookmarkCollections),
}));

export const userRelations = relations(user, ({many}) => ({
  collections: many(collections),
  sessions: many(session),
  bookmarks: many(bookmarks),
  accounts: many(account),
  tags: many(tags),
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
