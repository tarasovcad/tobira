import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {UnauthorizedError} from "@/lib/errors";

export async function getCurrentUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user?.id ?? null;
}

export async function requireAuthenticatedUserId() {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}
