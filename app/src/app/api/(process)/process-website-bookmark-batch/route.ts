import {NextRequest, NextResponse} from "next/server";
import {readWebsiteBatchJobRequest} from "@/lib/bookmarks/website/job-request";
import {processWebsiteBookmarkBatch} from "@/lib/bookmarks/website/process-batch";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const jobRequest = await readWebsiteBatchJobRequest(request);
  if (!jobRequest.ok) {
    return NextResponse.json({error: jobRequest.error}, {status: jobRequest.status});
  }

  try {
    const result = await processWebsiteBookmarkBatch(jobRequest.bookmarkIds);
    return NextResponse.json({success: true, ...result}, {headers: {"cache-control": "no-store"}});
  } catch (error) {
    logger.error("Website bookmark batch processing failed fatally", {
      bookmarkIds: jobRequest.bookmarkIds,
      error: toLogError(error),
    });
    return NextResponse.json(
      {error: "Failed to process bookmark batch"},
      {status: 500, headers: {"cache-control": "no-store"}},
    );
  }
}
