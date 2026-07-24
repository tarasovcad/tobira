import {NextRequest, NextResponse} from "next/server";
import {readWebsiteJobRequest} from "@/lib/bookmarks/website/job-request";
import {processWebsiteBookmark} from "@/lib/bookmarks/website/process";
import {
  trackWebsiteProcessingCompleted,
  type WebsiteBookmarkProcessingMetrics,
} from "@/lib/bookmarks/website/metrics";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const jobRequest = await readWebsiteJobRequest(request);
  if (!jobRequest.ok) {
    return NextResponse.json({error: jobRequest.error}, {status: jobRequest.status});
  }

  const metrics: WebsiteBookmarkProcessingMetrics = {};

  try {
    await processWebsiteBookmark(jobRequest.bookmarkId, metrics, startedAt);
    await trackWebsiteProcessingCompleted({
      durationMs: Math.round(performance.now() - startedAt),
      metrics,
      success: true,
      errorCode: "none",
    });
  } catch (error) {
    logger.error("Website bookmark processing failed", {
      bookmarkId: jobRequest.bookmarkId,
      error: toLogError(error),
    });
    await trackWebsiteProcessingCompleted({
      durationMs: Math.round(performance.now() - startedAt),
      metrics,
      success: false,
      errorCode: "processing_failed",
    });
    return NextResponse.json(
      {error: "Failed to enrich bookmark"},
      {status: 500, headers: {"cache-control": "no-store"}},
    );
  }

  return NextResponse.json({success: true}, {headers: {"cache-control": "no-store"}});
}
