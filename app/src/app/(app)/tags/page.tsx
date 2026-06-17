import {Suspense} from "react";
import {getTagsOverview} from "@/app/actions/tags";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import TagPage from "@/features/collections-tags/TagPage";
import {TagPageSkeleton} from "@/features/collections-tags/TagPageSkeleton";

export const metadata = {
  title: "Tags - Tobira",
  description:
    "Keep your growing library in order with custom tags that make every bookmark findable.",
};

const TagsDataWrapper = async ({userId}: {userId: string}) => {
  const data = await getTagsOverview(userId);

  return <TagPage data={data} />;
};

const TagsPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data?.user?.id) {
    redirect("/login");
  }

  const userId = data.user.id;

  return (
    <Suspense fallback={<TagPageSkeleton />}>
      <TagsDataWrapper userId={userId} />
    </Suspense>
  );
};

export default TagsPage;
