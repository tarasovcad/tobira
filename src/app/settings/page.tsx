import React from "react";
import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";

const SettingsPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return <AppShell session={data}>SettingsPage</AppShell>;
};

export default SettingsPage;
