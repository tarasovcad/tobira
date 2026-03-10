import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";
import {CustomVideoPlayer} from "@/components/ui/CustomVideoPlayer";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <div className="relative mx-auto max-w-4xl pt-10">
        <CustomVideoPlayer src="/media.mp4" className="w-full" autoPlay muted loop />
      </div>
    </AppShell>
  );
};

export default page;
