/**
 * Converts a string (like a URL) into a compact, URL-safe Base64 string
 */
export async function hashUrlToKey(url: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(url);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  // Convert the raw bytes directly to Base64
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));

  // Make it URL safe (replace + with -, / with _, remove padding =)
  const base64Url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  // Return just the first 15 characters
  return base64Url.substring(0, 15);
}
