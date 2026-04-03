import {NextRequest, NextResponse} from "next/server";
import {
  BestIcon,
  fetchFaviconCandidates,
  normalizeInputUrl,
  selectBestFaviconIcon,
} from "@/lib/fetch/web";

type FaviconResult = {
  inputUrl: string;
  normalizedUrl: string;
  finalUrl?: string;
  baseUrl?: string;
  icons: BestIcon[];
};

export async function GET(request: NextRequest) {
  const inputUrl = request.nextUrl.searchParams.get("url") ?? "";
  const modeParam = (request.nextUrl.searchParams.get("mode") ?? "all").toLowerCase();
  const mode = modeParam === "one" ? "one" : "all";

  let normalized: URL;
  try {
    normalized = normalizeInputUrl(inputUrl);
  } catch (e) {
    return NextResponse.json(
      {error: e instanceof Error ? e.message : "Invalid url"},
      {status: 400},
    );
  }

  const result: FaviconResult = {
    inputUrl,
    normalizedUrl: normalized.toString(),
    icons: [],
  };
  const candidates = await fetchFaviconCandidates(normalized.toString(), {
    userAgent: "void-favicon-finder/1.0",
  });
  result.finalUrl = candidates.finalUrl;
  result.baseUrl = candidates.baseUrl;
  result.icons = candidates.icons;

  if (mode === "one") {
    const best = selectBestFaviconIcon(result.icons);
    result.icons = best ? [best] : [];
  }

  return NextResponse.json(result, {
    headers: {
      "cache-control": "no-store",
    },
  });
}
