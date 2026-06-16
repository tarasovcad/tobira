import React from "react";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {SettingsContent} from "./SettingsContent";
import {redirect} from "next/navigation";

export const metadata = {
  title: "Settings – Tobira",
  description: "Manage your Tobira preferences, account, and workspace settings.",
};

const SettingsPage = async ({searchParams}: {searchParams: Promise<{tab?: string}>}) => {
  const activeTag = (await searchParams).tab ?? "general";
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) {
    redirect("/login");
  }

  return <SettingsContent activeTag={activeTag} user={data?.user} />;
};

export default SettingsPage;
