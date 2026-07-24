import {NextRequest, NextResponse} from "next/server";
import {readWebsiteBatchJobRequest} from "@/lib/bookmarks/website/job-request";
import {processWebsiteBookmarkBatch} from "@/lib/bookmarks/website/process-batch";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const startedAt = performance.now();
  const jobRequest = await readWebsiteBatchJobRequest(request);
  if (!jobRequest.ok) {
    return NextResponse.json({error: jobRequest.error}, {status: jobRequest.status});
  }

  try {
    await processWebsiteBookmarkBatch(jobRequest.bookmarkIds, startedAt);
  } catch (error) {
    logger.error("Website bookmark batch processing failed", {
      bookmarkIds: jobRequest.bookmarkIds,
      error: toLogError(error),
    });
    return NextResponse.json(
      {error: "Failed to enrich bookmark batch"},
      {status: 500, headers: {"cache-control": "no-store"}},
    );
  }

  return NextResponse.json({success: true}, {headers: {"cache-control": "no-store"}});
}
