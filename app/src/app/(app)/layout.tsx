import {Suspense, type ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {ViewOptionsProvider} from "@/components/providers/ViewOptionsProvider";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {auth} from "@/lib/auth/auth";
import {parseSidebarPreferences, SIDEBAR_PREFERENCES_COOKIE} from "@/lib/sidebar-preferences";
import {VIEW_OPTIONS_COOKIE} from "@/lib/view-options-cookie";
import {cookies, headers} from "next/headers";

export default async function AppLayout({children}: {children: ReactNode}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const cookieStore = await cookies();
  const sidebarPreferences = parseSidebarPreferences(
    cookieStore.get(SIDEBAR_PREFERENCES_COOKIE)?.value,
  );
  const viewOptionsCookie = cookieStore.get(VIEW_OPTIONS_COOKIE)?.value;

  const sidebar = session?.user?.id ? (
    <Suspense fallback={<SidebarSkeleton preferences={sidebarPreferences} />}>
      <SidebarDataWrapper userId={session.user.id} initialSidebarPreferences={sidebarPreferences} />
    </Suspense>
  ) : undefined;

  return (
    <ViewOptionsProvider initialCookieValue={viewOptionsCookie}>
      <AppShell session={session} sidebar={sidebar} initialSidebarPreferences={sidebarPreferences}>
        {children}
      </AppShell>
    </ViewOptionsProvider>
  );
}
