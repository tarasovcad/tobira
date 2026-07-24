import {inArray} from "drizzle-orm";
import {db} from "@/db";
import {websiteRecords} from "@/db/schema";
import type {WebsiteRecord} from "./records";

export async function getWebsiteRecordsByKeys(keys: string[]): Promise<WebsiteRecord[]> {
  if (keys.length === 0) return [];

  return db.select().from(websiteRecords).where(inArray(websiteRecords.key, keys));
}
