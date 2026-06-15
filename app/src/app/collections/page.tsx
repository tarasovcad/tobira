import AppShell from "@/components/app-shell/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";
import CollectionPage, {
  type CollectionPageData,
  type CollectionPageItem,
} from "../../features/collections-tags/CollectionPage";

export const metadata = {
  title: "Collections - Tobira",
  description: "Browse and organize your Tobira collections.",
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const fakeCollections: CollectionPageItem[] = [
  {
    id: "collection-design-references",
    name: "Design references",
    description: "Interfaces, palettes, spacing notes, and product details worth revisiting.",
    color: "#70D6FF",
    isPinned: true,
    createdAt: daysAgo(42),
    updatedAt: minutesAgo(12),
    itemCount: 48,
  },
  {
    id: "collection-reading-queue",
    name: "Reading queue",
    description: "Long-form articles, essays, and technical docs saved for focused sessions.",
    color: "#FFD166",
    isPinned: true,
    createdAt: daysAgo(38),
    updatedAt: daysAgo(1),
    itemCount: 27,
  },
  {
    id: "collection-build-ideas",
    name: "Build ideas",
    description: "Small product ideas, experiments, and implementation sketches.",
    color: "#95E06C",
    isPinned: false,
    createdAt: daysAgo(35),
    updatedAt: daysAgo(3),
    itemCount: 16,
  },
  {
    id: "collection-tools-to-try",
    name: "Tools to try",
    description: "Utilities, libraries, apps, and workflows to evaluate later.",
    color: "#C792EA",
    isPinned: false,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(8),
    itemCount: 34,
  },
  {
    id: "collection-launch-checklist",
    name: "Launch checklist",
    description: "Release notes, QA reminders, launch assets, and rollout references.",
    color: "#FF8FAB",
    isPinned: true,
    createdAt: daysAgo(28),
    updatedAt: hoursAgo(2),
    itemCount: 21,
  },
  {
    id: "collection-marketing-angles",
    name: "Marketing angles",
    description: "Positioning notes, landing page inspiration, and campaign examples.",
    color: "#F4A261",
    isPinned: false,
    createdAt: daysAgo(25),
    updatedAt: hoursAgo(5),
    itemCount: 39,
  },
  {
    id: "collection-technical-deep-dives",
    name: "Technical deep dives",
    description: "Architecture writeups, database guides, and implementation references.",
    color: "#4D96FF",
    isPinned: true,
    createdAt: daysAgo(23),
    updatedAt: daysAgo(2),
    itemCount: 62,
  },
  {
    id: "collection-customer-research",
    name: "Customer research",
    description: "Interview notes, feedback patterns, screenshots, and support insights.",
    color: "#06D6A0",
    isPinned: false,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(4),
    itemCount: 18,
  },
  {
    id: "collection-motion-ideas",
    name: "Motion ideas",
    description: "Interaction patterns, transition references, and animation timing notes.",
    color: "#B8F2E6",
    isPinned: false,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(6),
    itemCount: 13,
  },
  {
    id: "collection-competitor-notes",
    name: "Competitor notes",
    description: "Pricing pages, feature comparisons, onboarding flows, and messaging.",
    color: "#EF476F",
    isPinned: false,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(8),
    itemCount: 44,
  },
  {
    id: "collection-learning-backlog",
    name: "Learning backlog",
    description: "Courses, talks, tutorials, and concepts to study when there is time.",
    color: "#9B5DE5",
    isPinned: true,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(10),
    itemCount: 31,
  },
  {
    id: "collection-team-rituals",
    name: "Team rituals",
    description: "Meeting formats, retro prompts, planning templates, and async habits.",
    color: "#00BBF9",
    isPinned: false,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(14),
    itemCount: 11,
  },
];

const weekMs = 7 * 24 * 60 * 60 * 1000;

const fakeCollectionPageData: CollectionPageData = {
  collections: fakeCollections,
  stats: {
    collectionCount: fakeCollections.length,
    savedItemCount: fakeCollections.reduce((sum, collection) => sum + collection.itemCount, 0),
    uncategorizedItemCount: 7,
    updatedThisWeekCount: fakeCollections.filter(
      (collection) =>
        collection.updatedAt && Date.now() - Date.parse(collection.updatedAt) <= weekMs,
    ).length,
  },
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
      <CollectionPage data={fakeCollectionPageData} />
    </AppShell>
  );
};

export default CollectionsPage;
