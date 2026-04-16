"use client";

import {Button} from "@/components/coss-ui/button";

export const HarOption = () => (
  <>
    <p className="text-muted-foreground mb-3 text-[13.5px] leading-relaxed">
      Record all network traffic while browsing your bookmarks, then export and upload the HAR file.
    </p>
    <div className="border-border mb-3 divide-y overflow-hidden rounded-[8px] border">
      <div className="flex items-center justify-between gap-3 px-3 py-2">
        <span className="text-muted-foreground text-[13px]">Open DevTools</span>
        <div className="flex gap-1">
          <kbd className="border-border bg-muted text-muted-foreground rounded border px-2 py-0.5 font-mono text-[12px]">
            F12
          </kbd>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-muted-foreground text-[13px]">Go to tab</span>
        <span className="bg-muted text-foreground/70 rounded px-2 py-0.5 text-[12px] font-medium">
          Network
        </span>
      </div>
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-muted-foreground text-[13px]">Browse</span>
        <code className="text-muted-foreground/80 text-[12.5px]">x.com/i/bookmarks</code>
        <span className="text-muted-foreground/50 text-[12.5px]">&amp; scroll all</span>
      </div>
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-muted-foreground text-[13px]">Export</span>
        <span className="bg-muted text-foreground/70 rounded px-2 py-0.5 font-mono text-[12px]">
          Save all as HAR
        </span>
      </div>
    </div>
    <Button size="sm" className="w-full">
      Upload HAR File
    </Button>
  </>
);
