export async function extractXMedia(url: string) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const statusIndex = pathParts.indexOf("status");

    if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
      const postId = pathParts[statusIndex + 1];
      const apiUrl = `https://api.vxtwitter.com/Twitter/status/${postId}`;

      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`Failed to fetch from vxtwitter API: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("X Media Extraction:", JSON.stringify(data, null, 2));
      return data;
    } else {
      throw new Error("Invalid X/Twitter URL structure");
    }
  } catch (error) {
    console.error("Error extracting X media:", error);
    throw error;
  }
}
