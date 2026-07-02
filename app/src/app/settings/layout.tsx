import type {ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {Sidebar} from "@/components/app-shell/sidebar/Sidebar";
import {auth} from "@/lib/auth/auth";
import {parseSidebarPreferences, SIDEBAR_PREFERENCES_COOKIE} from "@/lib/sidebar-preferences";
import {cookies, headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function SettingsLayout({children}: {children: ReactNode}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const sidebarPreferences = parseSidebarPreferences(
    cookieStore.get(SIDEBAR_PREFERENCES_COOKIE)?.value,
  );

  return (
    <AppShell
      session={session}
      initialSidebarPreferences={sidebarPreferences}
      sidebar={
        <Sidebar
          mode="settings"
          allowModeSwitch
          isAuthenticated
          userId={session.user.id}
          initialPreferences={sidebarPreferences}
        />
      }>
      {children}
    </AppShell>
  );
}
