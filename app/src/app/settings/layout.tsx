import type {ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {Sidebar} from "@/components/app-shell/sidebar/Sidebar";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

export default async function SettingsLayout({children}: {children: ReactNode}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell
      session={session}
      sidebar={
        <Sidebar mode="settings" allowModeSwitch isAuthenticated userId={session.user.id} />
      }>
      {children}
    </AppShell>
  );
}
