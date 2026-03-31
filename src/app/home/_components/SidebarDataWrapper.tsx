import {getCollections} from "@/app/actions/collections";
import {getSidebarTags} from "@/app/actions/tags";
import {Sidebar} from "@/components/providers/Sidebar";
import {logger} from "@/lib/logger";

export async function SidebarDataWrapper({userId}: {userId: string}) {
  let sidebarData = null;

  try {
    const [allCollections, allTags] = await Promise.all([
      getCollections(userId),
      getSidebarTags(userId),
    ]);

    sidebarData = {allCollections, allTags};
  } catch (err) {
    logger.error("home: failed to load sidebar data", {
      err: err instanceof Error ? {message: err.message, stack: err.stack} : String(err),
      userId,
    });
    sidebarData = {allCollections: [], allTags: []};
  }

  return (
    <Sidebar
      allCollections={sidebarData.allCollections}
      allTags={sidebarData.allTags}
      isAuthenticated={true}
      userId={userId}
    />
  );
}
