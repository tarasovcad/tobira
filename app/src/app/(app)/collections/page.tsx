import {Suspense} from "react";
import {getCollectionsOverview} from "@/app/actions/collections";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import CollectionPage from "@/features/collections-tags/CollectionPage";
import {CollectionPageSkeleton} from "@/features/collections-tags/CollectionPageSkeleton";

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
    <Suspense fallback={<CollectionPageSkeleton />}>
      <CollectionsDataWrapper userId={userId} />
    </Suspense>
  );
};

export default CollectionsPage;
