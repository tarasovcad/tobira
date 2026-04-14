import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import React from "react";
import XPostsFeed from "./XPostsFeed";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <AppShell session={data}>
      <div className="flex h-full overflow-auto">
        <XPostsFeed />
      </div>
    </AppShell>
  );
};

export default page;
