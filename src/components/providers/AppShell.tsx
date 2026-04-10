"use client";

import React from "react";
import {AddItemDialog} from "./AddItemDialog";
import {BookmarkMenu} from "@/components/bookmark/BookmarkMenu";
import {Sidebar} from "./Sidebar";
import {CollectionDialog} from "./CollectionDialog";
import {DeleteBookmarkDialog} from "./DeleteBookmarkDialog";
import {DeleteCollectionDialog} from "./DeleteCollectionDialog";
import {DeleteTagDialog} from "./DeleteTagDialog";
import {TagDialog} from "./TagDialog";
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
        <AddItemDialog isAuthenticated={Boolean(session)} user={session?.user ?? null} />
      )}
      <BookmarkMenu userId={session?.user?.id ?? null} />
      <CollectionDialog isAuthenticated={Boolean(session)} />
      <DeleteBookmarkDialog />
      <DeleteCollectionDialog />
      <DeleteTagDialog />
      <TagDialog />
      <SyncSetupSheet />
    </main>
  );
};

export default AppShell;
