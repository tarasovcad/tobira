import {z} from "zod";
import {normalizeInputUrl, UnsafeFetchUrlError} from "@/lib/fetch/web/url";
import {extractUrls} from "./_utils/extract-urls";
import {ALLOWED_MEDIA_DOMAINS, ALLOWED_POST_DOMAINS} from "./add-bookmark-constants";

function getUrlValidationError(error: unknown) {
  if (error instanceof UnsafeFetchUrlError) {
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

  if (error instanceof Error && error.message === "Only http/https URLs are supported") {
    return error.message;
  }

  return "Please enter a valid URL";
}

export const addBookmarkSchema = z
  .object({
    url: z.string().trim().min(1, "URL is required"),
    tags: z.array(z.string()),
    collectionId: z.string().nullable().optional(),
    type: z.enum(["website", "media", "post"]),
  })
  .superRefine((data, ctx) => {
    if (!data.url) return;

    const extracted = extractUrls(data.url);
    if (extracted.length > 10) {
      ctx.addIssue({
        code: "custom",
        message: `Maximum 10 URLs allowed at a time`,
        path: ["url"],
      });
      return;
    }

    if (extracted.length === 0) {
      try {
        normalizeInputUrl(data.url);
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: getUrlValidationError(error),
          path: ["url"],
        });
      }
      return;
    }

    for (const rawUrl of extracted) {
      try {
        const u = normalizeInputUrl(rawUrl);
        const hostname = u.hostname.replace(/^www\./, "");

        if (data.type === "media" && !ALLOWED_MEDIA_DOMAINS.includes(hostname)) {
          ctx.addIssue({
            code: "custom",
            message: `Media type only supports x.com, twitter.com and reddit.com (${hostname})`,
            path: ["url"],
          });
          break;
        }

        if (data.type === "post") {
          if (!ALLOWED_POST_DOMAINS.includes(hostname)) {
            ctx.addIssue({
              code: "custom",
              message: `Post type only supports x.com and reddit.com (${hostname})`,
              path: ["url"],
            });
            break;
          } else {
            const pathParts = u.pathname.split("/").filter(Boolean);
            const hasStatus = pathParts.includes("status") || pathParts.includes("comments");
            if (!hasStatus) {
              ctx.addIssue({
                code: "custom",
                message: "Please enter a direct link to an individual post",
                path: ["url"],
              });
              break;
            }
          }
        }
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          message: getUrlValidationError(error),
          path: ["url"],
        });
        break;
      }
    }
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
