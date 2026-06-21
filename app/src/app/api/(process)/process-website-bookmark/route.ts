import {NextRequest, NextResponse} from "next/server";
import {readWebsiteJobRequest} from "@/lib/bookmarks/website/job-request";
import {processWebsiteBookmark} from "@/lib/bookmarks/website/process";
import {logger, toLogError} from "@/lib/shared/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const jobRequest = await readWebsiteJobRequest(request);
  if (!jobRequest.ok) {
    return NextResponse.json({error: jobRequest.error}, {status: jobRequest.status});
  }

  try {
    await processWebsiteBookmark(jobRequest.bookmarkId);
  } catch (error) {
    logger.error("Website bookmark processing failed", {
      bookmarkId: jobRequest.bookmarkId,
      error: toLogError(error),
    });
    return NextResponse.json(
      {error: "Failed to enrich bookmark"},
      {status: 500, headers: {"cache-control": "no-store"}},
    );
  }

  return NextResponse.json({success: true}, {headers: {"cache-control": "no-store"}});
}
