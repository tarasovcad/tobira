import {z} from "zod";
import {assertAllowedWebUrl, UnsafeFetchUrlError} from "@/lib/fetch/web/url";
import {ALLOWED_MEDIA_DOMAINS, ALLOWED_POST_DOMAINS} from "./add-bookmark-constants";

function getPublicUrlValidationError(url: string) {
  try {
    assertAllowedWebUrl(url);
    return null;
  } catch (error) {
    if (!(error instanceof UnsafeFetchUrlError)) return "Please enter a valid URL";
    if (error.message === "Hostname is not allowed") {
      return "URL must use a public hostname";
    }
    if (error.message === "Only default http/https ports are supported") {
      return "URL must use the default HTTP/HTTPS port";
    }
    if (error.message === "URL credentials are not allowed") {
      return "URL cannot contain a username or password";
    }
    return error.message;
  }
}

export const addBookmarkSchema = z
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
      const publicUrlError = getPublicUrlValidationError(data.url);

      if (publicUrlError) {
        ctx.addIssue({
          code: "custom",
          message: publicUrlError,
          path: ["url"],
        });
      }

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

export type AddBookmarkFormValues = z.infer<typeof addBookmarkSchema>;

export function createAddBookmarkDefaultValues({
  type = "website",
  collectionId = null,
  tagNames = [],
}: {
  type?: AddBookmarkFormValues["type"];
  collectionId?: string | null;
  tagNames?: string[];
} = {}): AddBookmarkFormValues {
  return {
    url: "",
    tags: [...tagNames],
    collectionId,
    type,
  };
}
