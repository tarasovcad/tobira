import React from "react";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {SyncContent} from "./SyncContent";
import {redirect} from "next/navigation";

export const metadata = {
  title: "Sync – Tobira",
  description: "Sync your manga with other services.",
};

const SyncPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) {
    redirect("/login");
  }

  return (
    <AppShell session={data}>
      <SyncContent />
    </AppShell>
  );
};

export default SyncPage;
