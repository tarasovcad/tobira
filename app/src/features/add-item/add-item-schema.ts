import {z} from "zod";
import {ALLOWED_MEDIA_DOMAINS, ALLOWED_POST_DOMAINS} from "./add-item-constants";

export const addItemSchema = z
  .object({
    url: z
      .string()
      .trim()
      .min(1, "URL is required")
      .url("Please enter a valid URL")
      .refine((s) => {
        try {
          const u = new URL(s);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      }, "URL must start with http:// or https://"),
    tags: z.array(z.string()),
    collectionId: z.string().nullable().optional(),
    type: z.enum(["website", "media", "post"]),
  })
  .superRefine((data, ctx) => {
    if (!data.url) return;
    try {
      const u = new URL(data.url);
      const hostname = u.hostname.replace(/^www\./, "");

      if (data.type === "media" && !ALLOWED_MEDIA_DOMAINS.includes(hostname)) {
        ctx.addIssue({
          code: "custom",
          message: "Media type only supports x.com, twitter.com and reddit.com",
          path: ["url"],
        });
      }

      if (data.type === "post") {
        if (!ALLOWED_POST_DOMAINS.includes(hostname)) {
          ctx.addIssue({
            code: "custom",
            message: "Post type only supports x.com and reddit.com",
            path: ["url"],
          });
        } else {
          const pathParts = u.pathname.split("/").filter(Boolean);
          const hasStatus = pathParts.includes("status") || pathParts.includes("comments");
          if (!hasStatus) {
            ctx.addIssue({
              code: "custom",
              message: "Please enter a direct link to an individual post",
              path: ["url"],
            });
          }
        }
      }
    } catch {}
  });

export type AddItemFormValues = z.infer<typeof addItemSchema>;
