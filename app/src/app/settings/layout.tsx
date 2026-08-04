import type {ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {Sidebar} from "@/components/app-shell/sidebar/Sidebar";
import {getCurrentSession} from "@/lib/auth/session";
import {parseSidebarPreferences, SIDEBAR_PREFERENCES_COOKIE} from "@/lib/sidebar-preferences";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";

export default async function SettingsLayout({children}: {children: ReactNode}) {
  const session = await getCurrentSession();

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
