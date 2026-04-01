const BASE_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.trim()?.replace(/\/+$/, "");

if (!BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_R2_PUBLIC_URL");
}

export function buildR2PublicUrl(key: string) {
  return `${BASE_URL}/${key.replace(/^\/+/, "")}`;
}
