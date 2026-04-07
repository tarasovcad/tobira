import React from "react";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {SyncContent} from "./_components/SyncContent";

export const metadata = {
  title: "Sync – Tobira",
  description: "Connect external sources to import bookmarks and content into your Tobira library.",
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
