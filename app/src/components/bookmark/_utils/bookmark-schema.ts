import {z} from "zod";

// Zod schema for bookmark form validation
export const bookmarkFormSchema = z
  .object({
    kind: z.enum(["website", "media", "post"]).default("website"),
    title: z.string().max(200, "Title must be less than 200 characters"),
    description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
    preview_image: z.url("Must be a valid URL").optional().or(z.literal("")),
    notes: z.string().max(1000, "Notes must be less than 1000 characters").optional(),
    tags: z.array(z.string()).max(10).default([]),
    collectionId: z.string().nullable().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === "website" && values.title.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required",
      });
    }
  });

export type BookmarkFormValues = z.input<typeof bookmarkFormSchema>;

export function normalizeTagsForCompare(tags: string[] | undefined) {
  return (tags ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, undefined, {sensitivity: "base"}))
    .join(",");
}
