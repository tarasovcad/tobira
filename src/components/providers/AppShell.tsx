"use client";

import React, {useState} from "react";
import {AddItemDialog} from "./AddItemDialog";
import {Sidebar} from "./Sidebar";
import {CollectionDialog} from "./CollectionDialog";
import {Header, type AppShellSession} from "./Header";
import type {Collection} from "@/app/actions/collections";

const AppShell = ({
  children,
  session,
  tags,
  collections,
}: {
  children: React.ReactNode;
  session: AppShellSession;
  tags?: {id: string; name: string; count: number}[];
  collections?: Collection[];
}) => {
  const [createCollectionOpen, setCreateCollectionOpen] = useState(false);
  return (
    <main className="flex h-dvh min-h-screen flex-col">
      <Header session={session} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar
          tags={tags}
          collections={collections}
          onCreateCollection={() => setCreateCollectionOpen(true)}
          isAuthenticated={Boolean(session)}
        />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      <AddItemDialog collections={collections} isAuthenticated={Boolean(session)} />
      <CollectionDialog
        open={createCollectionOpen}
        onOpenChange={setCreateCollectionOpen}
        isAuthenticated={Boolean(session)}
      />
    </main>
  );
};

export default AppShell;
