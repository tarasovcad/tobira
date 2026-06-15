import {Suspense} from "react";
import AppShell from "@/components/app-shell/AppShell";
import {SidebarDataWrapper} from "@/components/app-shell/sidebar/SidebarDataWrapper";
import {SidebarSkeleton} from "@/components/app-shell/sidebar/SidebarSkeleton";
import {getCollectionsOverview} from "@/app/actions/collections";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import CollectionPage from "../../features/collections-tags/CollectionPage";
import {CollectionPageSkeleton} from "../../features/collections-tags/CollectionPageSkeleton";

export const metadata = {
  title: "Collections - Tobira",
  description: "Browse and organize your Tobira collections.",
};

const CollectionsDataWrapper = async ({userId}: {userId: string}) => {
  const data = await getCollectionsOverview(userId);

  return <CollectionPage data={data} />;
};

const CollectionsPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;

  return (
    <AppShell
      session={data}
      sidebar={
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarDataWrapper userId={userId} />
        </Suspense>
      }>
      <Suspense fallback={<CollectionPageSkeleton />}>
        <CollectionsDataWrapper userId={userId} />
      </Suspense>
    </AppShell>
  );
};

export default CollectionsPage;
