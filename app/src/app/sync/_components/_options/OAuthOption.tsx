"use client";

import {useState} from "react";
import Image from "next/image";
import {Slider} from "@/components/ui/slider";
import {Alert, AlertDescription, AlertTitle} from "@/components/coss-ui/alert";
import {CircleAlertIcon} from "@/components/coss-ui/toast";
import {Button} from "@/components/coss-ui/button";

interface OAuthOptionProps {
  providerName: string;
  providerImage: string;
}

const OAuthPricing = () => {
  const [bookmarks, setBookmarks] = useState(5000);

  const formattedCost = (bookmarks * 0.005).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const resourceLabel =
    bookmarks >= 1000
      ? `${(bookmarks / 1000).toFixed(bookmarks % 1000 === 0 ? 0 : 1)}k posts`
      : `${bookmarks} posts`;

  return (
    <div className="text-sm">
      <div className="border-border text-muted-foreground overflow-hidden rounded-[10px] border">
        <div className="border-border flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm">Bookmarks</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono font-[450] tabular-nums">$0.005</span>
            <span className="">/ post</span>
          </div>
        </div>

        <div className="px-3 pt-2.5 pb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Usage</span>
            <span className="text-foreground/70 font-[450] tabular-nums">{resourceLabel}</span>
          </div>

          <Slider
            value={bookmarks}
            onChange={(v) => setBookmarks(v as number)}
            min={0}
            max={50000}
            step={5000}
            showValue={false}
            formatValue={(v) =>
              (v * 0.005).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 2,
              })
            }
          />

          <div className="relative mt-0 flex items-center justify-between">
            <span className="text-muted-foreground text-[13px]">0k</span>
            <span className="text-foreground! pointer-events-none absolute left-1/2 -translate-x-1/2 font-mono text-[13px] font-[450] tabular-nums transition-colors duration-200">
              {formattedCost}
            </span>
            <span className="text-muted-foreground text-[13px]">50k</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const OAuthOption = ({providerName, providerImage}: OAuthOptionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-center py-2">
      <div className="relative flex items-center">
        <div className="border-border ml-1.5 size-[44px] overflow-hidden rounded-full">
          <Image
            src="/logo/favicon.svg"
            alt="Tobira"
            width={32}
            height={32}
            className="h-full w-full"
          />
        </div>
        <div className="border-border -ml-1.5 size-[44px] overflow-hidden rounded-full">
          <Image
            src={providerImage}
            alt={providerName}
            width={32}
            height={32}
            className="h-full w-full"
          />
        </div>
      </div>
    </div>
    <p className="text-muted-foreground mb-1 text-center text-sm">
      You&apos;ll be redirected to X to approve read-only access, then returned here automatically.
    </p>
    <Alert variant="warning">
      <CircleAlertIcon />
      <AlertTitle>API costs can be significant</AlertTitle>
      <AlertDescription>Syncing large collections can quickly become expensive</AlertDescription>
    </Alert>
    <OAuthPricing />
    <Button className="w-full">Authorize with {providerName}</Button>
  </div>
);
