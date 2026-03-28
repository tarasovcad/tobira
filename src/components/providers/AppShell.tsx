"use client";

import React from "react";
import {AddItemDialog} from "./AddItemDialog";
import {Sidebar} from "./Sidebar";
import {CollectionDialog} from "./CollectionDialog";
import {DeleteCollectionDialog} from "./DeleteCollectionDialog";
import {DeleteTagDialog} from "./DeleteTagDialog";
import {TagDialog} from "./TagDialog";
import {Header, type AppShellSession} from "./Header";
import type {Collection} from "@/app/actions/collections";
import type {TagWithCount} from "@/app/home/_types";

const AppShell = ({
  children,
  session,
  tags,
  collections,
}: {
  children: React.ReactNode;
  session: AppShellSession;
  tags?: TagWithCount[];
  collections?: Collection[];
}) => {
  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-auto">
        <Sidebar tags={tags} collections={collections} isAuthenticated={Boolean(session)} />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <AddItemDialog collections={collections} isAuthenticated={Boolean(session)} />
      <CollectionDialog isAuthenticated={Boolean(session)} />
      <DeleteCollectionDialog />
      <DeleteTagDialog />
      <TagDialog />
    </main>
  );
};

export default AppShell;
