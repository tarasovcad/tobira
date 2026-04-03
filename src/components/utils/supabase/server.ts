import {createServerClient} from "@supabase/ssr";
import {cookies, headers} from "next/headers";
import {auth} from "@/lib/auth/auth";
import jwt from "jsonwebtoken";

export async function createClient() {
  const cookieStore = await cookies();
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  let customAccessToken = null;
  // If the user is authenticated, generate a custom JWT for Supabase RLS
  if (session?.user && process.env.SUPABASE_JWT_SECRET) {
    const payload = {
      aud: "authenticated",
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
      sub: session.user.id,
      role: "authenticated",
    };
    customAccessToken = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET);
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: customAccessToken
          ? {
              Authorization: `Bearer ${customAccessToken}`,
            }
          : undefined,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

export type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
