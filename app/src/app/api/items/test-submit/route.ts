import {auth} from "@/lib/auth/auth";
import {NextRequest, NextResponse} from "next/server";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({error: "Unauthorized"}, {status: 401});
  }

  // For now: ignore real data and use a dummy payload.
  const usedText = "test test";

  return NextResponse.json({
    ok: true,
    usedText,
  });
}
