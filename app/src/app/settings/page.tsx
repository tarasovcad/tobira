import {SettingsContent} from "./SettingsContent";
import {auth} from "@/lib/auth/auth";
import {listExtensionConnections} from "@/lib/auth/extension-connections";
import {headers} from "next/headers";

export const metadata = {
  title: "Settings – Tobira",
  description: "Manage your Tobira preferences, account, and workspace settings.",
};

const SettingsPage = async ({searchParams}: {searchParams: Promise<{tab?: string}>}) => {
  const activeTag = (await searchParams).tab ?? "general";
  const session = await auth.api.getSession({headers: await headers()});
  const extensionConnections =
    activeTag === "account" && session ? await listExtensionConnections(session.user.id) : [];

  return (
    <SettingsContent
      activeTag={activeTag}
      accountEmail={session?.user.email ?? ""}
      extensionConnections={extensionConnections}
    />
  );
};

export default SettingsPage;
