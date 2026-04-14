import {z} from "zod";
import {ALLOWED_MEDIA_DOMAINS} from "./constants";

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
    type: z.enum(["website", "media", "article"]),
  })
  .superRefine((data, ctx) => {
    if (data.type === "media" && data.url) {
      try {
        const u = new URL(data.url);
        const hostname = u.hostname.replace(/^www\./, "");
        if (!ALLOWED_MEDIA_DOMAINS.includes(hostname)) {
          ctx.addIssue({
            code: "custom",
            message: "Media type doesn't match allowed domains",
            path: ["url"],
          });
        }
      } catch {}
    }
  });

export type AddItemFormValues = z.infer<typeof addItemSchema>;
