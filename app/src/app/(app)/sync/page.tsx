import React from "react";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";

import {redirect} from "next/navigation";
import {Suspense} from "react";
import {PageHeader} from "@/components/ui/app/page/PageHeader";
import {ScrollArea} from "@/components/ui/coss/scroll-area";
import {ProvidersSection} from "./_components/ProvidersSection";
import {
  ConnectedAccountsDataWrapper,
  ConnectedAccountsSkeleton,
} from "./_components/ConnectedAccountsDataWrapper";
import {SyncStats, SyncStatsSkeleton} from "./_components/SyncStats";
import {SyncActivityDataWrapper, SyncActivitySkeleton} from "./_components/SyncActivityDataWrapper";

export const metadata = {
  title: "Sync – Tobira",
  description: "Sync your manga with other services.",
};

const SyncPage = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  if (!data) {
    redirect("/login");
  }

  return (
    <div className="flex h-full w-full">
      <ScrollArea className="min-h-0 flex-1 py-12" viewportProps={{tabIndex: -1}}>
        <div className="mx-auto max-w-4xl px-6">
          <div className="">
            <div className="mb-16">
              <PageHeader
                title="Sync"
                description="Connect outside services and bring your saved content into Tobira. Imported items are organized alongside everything else."
              />
              <Suspense fallback={<SyncStatsSkeleton />}>
                <SyncStats userId={data.user.id} />
              </Suspense>
            </div>
            <ProvidersSection />
            <Suspense fallback={<ConnectedAccountsSkeleton />}>
              <ConnectedAccountsDataWrapper userId={data.user.id} />
            </Suspense>
            <Suspense fallback={<SyncActivitySkeleton />}>
              <SyncActivityDataWrapper userId={data.user.id} />
            </Suspense>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default SyncPage;
