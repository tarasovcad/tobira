import {Suspense, type ReactNode} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";

export default async function AppLayout({children}: {children: ReactNode}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const sidebar = session?.user?.id ? (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarDataWrapper userId={session.user.id} />
    </Suspense>
  ) : undefined;

  return (
    <AppShell session={session} sidebar={sidebar}>
      {children}
    </AppShell>
  );
}
