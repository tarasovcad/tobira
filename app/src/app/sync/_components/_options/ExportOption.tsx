"use client";

import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/coss/button";

const NAVIGATION_CRUMBS = ["X Settings", "Your Account", "Download an archive of your data"];

export const ExportOption = () => (
  <>
    <p className="text-muted-foreground mb-3 text-[13.5px] leading-relaxed">
      Request your data archive from X, then upload the .zip file once it arrives via email.
    </p>
    <div className="border-border mb-3 overflow-hidden rounded-[8px] border">
      <div className="bg-muted/40 px-3 py-1.5">
        <p className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
          Navigate to
        </p>
      </div>
      {NAVIGATION_CRUMBS.map((crumb, i, arr) => (
        <div
          key={crumb}
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            i < arr.length - 1 && "border-border border-b",
          )}>
          <span className="text-muted-foreground/40 text-[12.5px]">{i + 1}</span>
          <span
            className={cn(
              "text-[13px]",
              i === arr.length - 1 ? "text-foreground font-[520]" : "text-muted-foreground",
            )}>
            {crumb}
          </span>
        </div>
      ))}
    </div>
    <div className="border-border mb-3 flex items-center gap-2.5 rounded-[8px] border px-3 py-2.5">
      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-[6px]">
        <span className="text-muted-foreground font-mono text-[11px] font-bold">.zip</span>
      </div>
      <div>
        <p className="text-foreground text-[13px] font-medium">twitter-archive.zip</p>
        <p className="text-muted-foreground/60 text-[12px]">Usually arrives within 24 hours</p>
      </div>
    </div>
    <Button size="sm" className="w-full">
      Upload .zip Archive
    </Button>
  </>
);
