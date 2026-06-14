import AppShell from "@/components/app-shell/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import CollectionPage from "./CollectionPage";

export const metadata = {
  title: "Collections - Tobira",
  description: "Browse and organize your Tobira collections.",
};

const CollectionsPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) {
    redirect("/login");
  }

  return (
    <AppShell session={data}>
      <CollectionPage />
    </AppShell>
  );
};

export default CollectionsPage;
