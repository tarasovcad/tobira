import AppShell from "@/components/providers/AppShell";
import {auth} from "@/lib/auth";
import {headers} from "next/headers";
import React from "react";
import ImagePreview from "@/components/ui/ImagePreview";

const page = async () => {
  const data = await auth.api.getSession({
    headers: await headers(),
  });
  return (
    <AppShell session={data}>
      <div className="relative mx-auto max-w-4xl pt-10">
        {/* <CustomVideoPlayer src="/media.mp4" className="w-full" autoPlay muted loop /> */}
        <ImagePreview
          src="https://jvnaqdowfvgjeiiynebq.supabase.co/storage/v1/object/public/bookmark-media/3245dfb7-e7f4-4ddd-bafd-3e89419e0592/media.jpg"
          alt="Media"
          width={1000}
          height={1000}
          className="h-auto w-full rounded-xl"
          previewClassName="object-contain"
        />
      </div>
    </AppShell>
  );
};

export default page;
