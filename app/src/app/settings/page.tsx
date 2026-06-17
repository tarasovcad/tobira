import {SettingsContent} from "./SettingsContent";

export const metadata = {
  title: "Settings – Tobira",
  description: "Manage your Tobira preferences, account, and workspace settings.",
};

const SettingsPage = async ({searchParams}: {searchParams: Promise<{tab?: string}>}) => {
  const activeTag = (await searchParams).tab ?? "general";

  return <SettingsContent activeTag={activeTag} />;
};

export default SettingsPage;
