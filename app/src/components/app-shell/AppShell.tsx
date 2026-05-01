"use client";

import React from "react";
import {AddBookmarkDialog} from "@/features/add-item/AddBookmarkDialog";
import {WebsiteBookmarkMenu} from "@/components/bookmark/_components/website/WebsiteBookmarkMenu";
import {MediaBookmarkMenu} from "@/components/bookmark/_components/media/MediaBookmarkMenu";
import {Sidebar} from "./sidebar/Sidebar";
import {CollectionDialog} from "../library/CollectionDialog";
import {DeleteBookmarkDialog} from "../bookmark/DeleteBookmarkDialog";
import {DeleteCollectionDialog} from "../library/DeleteCollectionDialog";
import {DeleteTagDialog} from "../library/DeleteTagDialog";
import {TagDialog} from "../library/TagDialog";
import {Header, type AppShellSession} from "./Header";
import SyncSetupSheet from "@/app/sync/_components/SyncSetupSheet";

const AppShell = ({
  children,
  session,
  sidebar,
  displayAddBookmarkDialog = false,
}: {
  children: React.ReactNode;
  session: AppShellSession;
  sidebar?: React.ReactNode;
  displayAddBookmarkDialog?: boolean;
}) => {
  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-auto">
        {sidebar ?? <Sidebar isAuthenticated={Boolean(session)} userId={session?.user?.id} />}
        <div className="min-h-0 flex-1">{children}</div>
      </div>

      {displayAddBookmarkDialog && (
        <AddBookmarkDialog isAuthenticated={Boolean(session)} user={session?.user ?? null} />
      )}
      <WebsiteBookmarkMenu userId={session?.user?.id ?? null} />
      <MediaBookmarkMenu userId={session?.user?.id ?? null} />
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
