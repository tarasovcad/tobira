import {cache} from "react";
import {headers} from "next/headers";
import {auth} from "@/lib/auth/auth";
import {UnauthorizedError} from "@/lib/shared/errors";

export const getCurrentSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function getCurrentUserId() {
  const session = await getCurrentSession();
  return session?.user?.id ?? null;
}

export async function requireAuthenticatedUserId() {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new UnauthorizedError();
  }

  return userId;
}
