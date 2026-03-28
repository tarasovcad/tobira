import React from "react";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import {SettingsContent} from "./SettingsContent";

export const metadata = {
  title: "Settings – Tobira",
  description: "Manage your Tobira preferences, account, and workspace settings.",
};

const SettingsPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <SettingsContent />
    </AppShell>
  );
};

export default SettingsPage;
