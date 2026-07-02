import {Suspense, type ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {auth} from "@/lib/auth/auth";
import {parseSidebarPreferences, SIDEBAR_PREFERENCES_COOKIE} from "@/lib/sidebar-preferences";
import {cookies, headers} from "next/headers";

export default async function AppLayout({children}: {children: ReactNode}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const cookieStore = await cookies();
  const sidebarPreferences = parseSidebarPreferences(
    cookieStore.get(SIDEBAR_PREFERENCES_COOKIE)?.value,
  );

  const sidebar = session?.user?.id ? (
    <Suspense fallback={<SidebarSkeleton preferences={sidebarPreferences} />}>
      <SidebarDataWrapper userId={session.user.id} initialSidebarPreferences={sidebarPreferences} />
    </Suspense>
  ) : undefined;

  return (
    <AppShell session={session} sidebar={sidebar} initialSidebarPreferences={sidebarPreferences}>
      {children}
    </AppShell>
  );
}
