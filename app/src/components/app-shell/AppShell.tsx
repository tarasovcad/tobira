"use client";

import React from "react";
import {WebsiteBookmarkMenu} from "@/components/bookmark/_components/website/WebsiteBookmarkMenu";
import {MediaBookmarkMenu} from "@/components/bookmark/_components/media/MediaBookmarkMenu";
import {PostBookmarkMenu} from "@/components/bookmark/_components/post/PostBookmarkMenu";
import {Sidebar} from "./sidebar/Sidebar";
import {useSidebarShortcut} from "./use-sidebar-shortcut";
import {CollectionDialog} from "../library/CollectionDialog";
import {DeleteBookmarkDialog} from "../bookmark/DeleteBookmarkDialog";
import {DeleteCollectionDialog} from "../library/DeleteCollectionDialog";
import {DeleteTagDialog} from "../library/DeleteTagDialog";
import {TagDialog} from "../library/TagDialog";
import {Header, type AppShellSession} from "./Header";
import SyncSetupSheet from "@/app/(app)/sync/_components/SyncSetupSheet";
import type {SidebarPreferences} from "@/lib/sidebar-preferences";

const AppShell = ({
  children,
  session,
  sidebar,
  initialSidebarPreferences,
}: {
  children: React.ReactNode;
  session: AppShellSession;
  sidebar?: React.ReactNode;
  initialSidebarPreferences?: SidebarPreferences;
}) => {
  useSidebarShortcut();

  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-auto">
        {sidebar ?? (
          <Sidebar
            isAuthenticated={Boolean(session)}
            userId={session?.user?.id}
            initialPreferences={initialSidebarPreferences}
          />
        )}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <WebsiteBookmarkMenu userId={session?.user?.id ?? null} />
      <MediaBookmarkMenu userId={session?.user?.id ?? null} />
      <PostBookmarkMenu userId={session?.user?.id ?? null} />
      <CollectionDialog isAuthenticated={Boolean(session)} />
      <DeleteBookmarkDialog />
      <DeleteCollectionDialog />
      <DeleteTagDialog />
      <TagDialog />
      <SyncSetupSheet userId={session?.user?.id} />
    </main>
  );
};

export default AppShell;
