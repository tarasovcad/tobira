"use client";

import React, {useMemo} from "react";
import {AddItemDialog} from "../bookmark/AddItemDialog";
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
import {useBookmarkMenuStore} from "@/store/use-bookmark-menu-store";

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
  const bookmarkKind = useBookmarkMenuStore((state) => state.item?.kind);

  const BookmarkMenu = useMemo(() => {
    switch (bookmarkKind) {
      case "website":
        return <WebsiteBookmarkMenu userId={session?.user?.id ?? null} />;
      case "media":
        return <MediaBookmarkMenu userId={session?.user?.id ?? null} />;
    }
  }, [bookmarkKind, session?.user?.id]);

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
      {BookmarkMenu}
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
