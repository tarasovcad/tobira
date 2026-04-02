"use client";

import React from "react";
import {AddItemDialog} from "./AddItemDialog";
import {Sidebar} from "./Sidebar";
import {CollectionDialog} from "./CollectionDialog";
import {DeleteCollectionDialog} from "./DeleteCollectionDialog";
import {DeleteTagDialog} from "./DeleteTagDialog";
import {TagDialog} from "./TagDialog";
import {Header, type AppShellSession} from "./Header";

const AppShell = ({
  children,
  session,
  sidebar,
}: {
  children: React.ReactNode;
  session: AppShellSession;
  sidebar?: React.ReactNode;
}) => {
  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-auto">
        {sidebar ?? <Sidebar isAuthenticated={Boolean(session)} userId={session?.user?.id} />}
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <AddItemDialog isAuthenticated={Boolean(session)} userId={session?.user?.id} />
      <CollectionDialog isAuthenticated={Boolean(session)} />
      <DeleteCollectionDialog />
      <DeleteTagDialog />
      <TagDialog />
    </main>
  );
};

export default AppShell;
