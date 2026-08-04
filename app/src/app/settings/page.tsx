import {SettingsContent} from "./SettingsContent";
import {listExtensionConnections} from "@/lib/auth/extension-connections";
import {getCurrentSession} from "@/lib/auth/session";

export const metadata = {
  title: "Settings – Tobira",
  description: "Manage your Tobira preferences, account, and workspace settings.",
};

const SettingsPage = async ({searchParams}: {searchParams: Promise<{tab?: string}>}) => {
  const activeTag = (await searchParams).tab ?? "general";
  const session = await getCurrentSession();
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
