export async function extractXMedia(url: string) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const statusIndex = pathParts.indexOf("status");

    if (statusIndex !== -1 && pathParts.length > statusIndex + 1) {
      const postId = pathParts[statusIndex + 1];
      const apiUrl = `https://api.vxtwitter.com/Twitter/status/${postId}`;

      const res = await fetch(apiUrl, {cache: "no-store"});
      if (!res.ok) {
        throw new Error(`Failed to fetch from vxtwitter API: ${res.statusText}`);
      }

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Vxtwitter API returned non-JSON response:", text.substring(0, 500));
        throw new Error(
          "Failed to parse JSON from vxtwitter API. It might be returning an HTML page (e.g., Cloudflare challenge).",
        );
      }

      const filteredData = {
        date: data.date,
        hasMedia: data.hasMedia,
        mediaURLs: data.mediaURLs,
        text: data.text,
        user_name: data.user_name,
        user_screen_name: data.user_screen_name,
        media_extended: data.media_extended,
      };

      return filteredData;
    } else {
      throw new Error("Invalid X/Twitter URL structure");
    }
  } catch (error) {
    console.error("Error extracting X media:", error);
    throw error;
  }
}
