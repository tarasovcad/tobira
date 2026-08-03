import {z} from "zod";

const platformOsValues = ["mac", "win", "android", "cros", "linux", "openbsd", "fuchsia"] as const;

const platformArchitectureValues = [
  "arm",
  "arm64",
  "x86-32",
  "x86-64",
  "mips",
  "mips64",
  "riscv64",
] as const;

export const extensionClientMetadataSchema = z
  .object({
    installationId: z.string().uuid(),
    browser: z.literal("chrome"),
    os: z.enum(platformOsValues),
    architecture: z.enum(platformArchitectureValues),
    extensionVersion: z
      .string()
      .min(1)
      .max(32)
      .regex(/^[0-9A-Za-z._-]+$/),
  })
  .strict();

export type ExtensionClientMetadata = z.infer<typeof extensionClientMetadataSchema>;

export function parseExtensionClientMetadata(value: unknown): ExtensionClientMetadata | null {
  const result = extensionClientMetadataSchema.safeParse(value);
  return result.success ? result.data : null;
}
