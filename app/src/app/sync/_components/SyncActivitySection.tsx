"use client";

import {useMemo, useState} from "react";
import {cn} from "@/lib/utils";
import Image from "next/image";
import {formatTimeRelativeUtc} from "@/lib/utils/dates";
import {motion} from "motion/react";
import {Alert, AlertTitle} from "@/components/ui/coss/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/coss/accordion";
import {Button} from "@/components/ui/coss/button";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {Tabs, TabsList, TabsTab} from "@/components/ui/coss/tabs";
import {PROVIDERS} from "@/app/sync/_lib/sync-providers";

export type SyncActivityStatus = "success" | "running" | "warning" | "error";
type SyncActivityTag = "all" | "success" | "error" | "warning" | "info";

export type SyncActivityItem = {
  id: string;
  provider: string;
  account: string;
  summary: string;
  details: string;
  status: SyncActivityStatus;
  time: string;
  duration: string;
  items: string;
  color: string;
};

function SuccessCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.0003 1.66666C14.6027 1.66666 18.3337 5.39761 18.3337 9.99999C18.3337 14.6023 14.6027 18.3333 10.0003 18.3333C5.39795 18.3333 1.66699 14.6023 1.66699 9.99999C1.66699 5.39761 5.39795 1.66666 10.0003 1.66666ZM12.9658 6.80907C12.5841 6.55216 12.0665 6.65295 11.8094 7.0345L8.72758 11.6113L7.25618 10.14C6.93075 9.81449 6.40323 9.81449 6.0778 10.14C5.75236 10.4654 5.75236 10.9929 6.0778 11.3183L8.2653 13.5058C8.44141 13.6819 8.68724 13.7699 8.93508 13.7459C9.18266 13.7218 9.40641 13.5885 9.54541 13.3822L13.1912 7.96548C13.4482 7.58378 13.3474 7.06613 12.9658 6.80907Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RotatingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        d="M5.86881 14.1667C6.93642 15.1966 8.40769 15.8333 9.99977 15.8333C13.2214 15.8333 15.8331 13.2217 15.8331 9.99999C15.8331 9.53974 16.2062 9.16666 16.6664 9.16666C17.1267 9.16666 17.4998 9.53974 17.4998 9.99999C17.4998 14.1422 14.1419 17.5 9.99977 17.5C8.1027 17.5 6.33962 16.7947 4.99967 15.6298V16.6667C4.99967 17.1269 4.62657 17.5 4.16634 17.5C3.7061 17.5 3.33301 17.1269 3.33301 16.6667V14.1667C3.33301 13.2462 4.0792 12.5 4.99967 12.5H7.29134C7.75157 12.5 8.12467 12.8731 8.12467 13.3333C8.12467 13.7936 7.75157 14.1667 7.29134 14.1667H5.86881Z"
        fill="currentColor"
      />
      <path
        d="M4.16667 10C4.16667 10.4602 3.79357 10.8333 3.33333 10.8333C2.8731 10.8333 2.5 10.4602 2.5 10C2.5 5.85787 5.85787 2.5 10 2.5C11.9017 2.5 13.6687 3.20863 15.0097 4.37858V3.33333C15.0097 2.8731 15.3828 2.5 15.8431 2.5C16.3033 2.5 16.6764 2.8731 16.6764 3.33333V5.83333C16.6764 6.75381 15.9302 7.5 15.0097 7.5H12.5097C12.0495 7.5 11.6764 7.12691 11.6764 6.66667C11.6764 6.20642 12.0495 5.83333 12.5097 5.83333H14.131C13.0633 4.80345 11.5921 4.16667 10 4.16667C6.77834 4.16667 4.16667 6.77834 4.16667 10Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TriangleAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.16851 3.3924C8.47276 1.29433 11.5262 1.29433 12.8304 3.3924L17.916 11.5737C19.2963 13.7941 17.6996 16.6667 15.0851 16.6667H4.91383C2.29936 16.6667 0.702612 13.7941 2.08288 11.5737L7.16851 3.3924ZM9.99967 6.66666C10.4599 6.66666 10.833 7.03976 10.833 7.5V10C10.833 10.4602 10.4599 10.8333 9.99967 10.8333C9.53942 10.8333 9.16634 10.4602 9.16634 10V7.5C9.16634 7.03976 9.53942 6.66666 9.99967 6.66666ZM8.95801 12.5C8.95801 11.9247 9.42434 11.4583 9.99967 11.4583C10.575 11.4583 11.0413 11.9247 11.0413 12.5C11.0413 13.0753 10.575 13.5417 9.99967 13.5417C9.42434 13.5417 8.95801 13.0753 8.95801 12.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CircleXIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 1.66666C5.39762 1.66666 1.66667 5.39761 1.66667 9.99999C1.66667 14.6023 5.39762 18.3333 10 18.3333C14.6024 18.3333 18.3333 14.6023 18.3333 9.99999C18.3333 5.39761 14.6024 1.66666 10 1.66666ZM13.0892 6.91074C13.4147 7.23618 13.4147 7.76382 13.0892 8.08926L11.1785 10L13.0892 11.9107C13.4147 12.2362 13.4147 12.7638 13.0892 13.0893C12.7638 13.4147 12.2362 13.4147 11.9107 13.0893L10 11.1785L8.08926 13.0893C7.76382 13.4147 7.23618 13.4147 6.91074 13.0893C6.5853 12.7638 6.5853 12.2362 6.91074 11.9107L8.82149 10L6.91074 8.08926C6.5853 7.76382 6.5853 7.23618 6.91074 6.91074C7.23618 6.5853 7.76382 6.5853 8.08926 6.91074L10 8.82149L11.9107 6.91074C12.2362 6.5853 12.7638 6.5853 13.0892 6.91074Z"
        fill="currentColor"
      />
    </svg>
  );
}

function getSyncActivityTimestamp(time: string) {
  const normalized = time.replace(" ", "T").replace(/\+00$/, "Z");
  const parsed = Date.parse(normalized);

  return Number.isNaN(parsed) ? 0 : parsed;
}

function getSyncActivityDayLabel(time: string) {
  const timestamp = getSyncActivityTimestamp(time);
  if (!timestamp) return "Unknown date";

  const now = new Date();
  const activityDate = new Date(timestamp);
  const msPerDay = 1000 * 60 * 60 * 24;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfActivityDay = new Date(
    activityDate.getFullYear(),
    activityDate.getMonth(),
    activityDate.getDate(),
  );

  const diffInDays = Math.floor((startOfToday.getTime() - startOfActivityDay.getTime()) / msPerDay);

  if (diffInDays <= 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  return "Earlier";
}

function getProviderIcon(provider: string): {src: string; invertOnDark?: boolean} | null {
  const p = provider.trim().toLowerCase();

  const match = PROVIDERS.find((x) => x.name.trim().toLowerCase() === p);
  if (!match) return null;

  return {src: match.image, invertOnDark: match.invertOnDark};
}

function matchesSyncTag(item: SyncActivityItem, tag: SyncActivityTag) {
  if (tag === "all") return true;
  if (tag === "info") return item.status === "running";
  return item.status === tag;
}

function matchesSyncQuery(item: SyncActivityItem, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  return [
    item.provider,
    item.account,
    item.summary,
    item.details,
    item.items,
    item.duration,
    formatTimeRelativeUtc(item.time),
  ].some((value) => value.toLowerCase().includes(query));
}

function getSyncedItemCount(itemsLabel: string) {
  const match = itemsLabel.match(/[\d,]+/);
  if (!match) return null;

  const parsed = Number.parseInt(match[0].replaceAll(",", ""), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function SyncActivitySection({initialActivity}: {initialActivity: SyncActivityItem[]}) {
  const initialCount = 5;
  const step = 10;

  const [activityCollapsed, setActivityCollapsed] = useState(false);
  const [selectedTag, setSelectedTag] = useState<SyncActivityTag>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const filteredActivity = useMemo(
    () =>
      initialActivity.filter(
        (item) => matchesSyncTag(item, selectedTag) && matchesSyncQuery(item, searchQuery),
      ),
    [initialActivity, searchQuery, selectedTag],
  );
  const totalCount = filteredActivity.length;
  const clampedVisibleCount = Math.min(visibleCount, totalCount);
  const visibleActivity = filteredActivity.slice(0, clampedVisibleCount);
  const canShowMore = clampedVisibleCount < totalCount;
  const showToggle = totalCount > initialCount;

  return (
    <div className="space-y-4">
      <h4 className="text-base font-[550]">
        <button
          type="button"
          onClick={() => setActivityCollapsed((v) => !v)}
          aria-expanded={!activityCollapsed}
          className="text-foreground/95 group hit-area-5 [&>svg]:text-muted-foreground relative inline-flex cursor-pointer items-center">
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "absolute top-1/2 left-[-21px] -translate-y-1/2 opacity-0 transition-opacity duration-150 ease-out will-change-transform group-hover:opacity-100",
              activityCollapsed && "opacity-100",
            )}
            style={{transformOrigin: "50% 50%"}}
            initial={false}
            animate={{rotate: activityCollapsed ? 90 : 0}}
            transition={{duration: 0.22, ease: [0.22, 1, 0.36, 1]}}
            aria-hidden>
            <path
              d="M6.80473 3.52859C6.5444 3.26824 6.1224 3.26824 5.862 3.52859C5.60167 3.78894 5.60167 4.21095 5.862 4.4713L9.39067 7.99993L5.862 11.5286C5.60167 11.7889 5.60167 12.2109 5.862 12.4713C6.1224 12.7317 6.5444 12.7317 6.80473 12.4713L10.8047 8.47133C11.0651 8.21093 11.0651 7.78893 10.8047 7.5286L6.80473 3.52859Z"
              fill="currentColor"
            />
          </motion.svg>
          Sync activity
        </button>
      </h4>

      <div className="">
        <motion.div
          initial={false}
          animate={activityCollapsed ? "collapsed" : "expanded"}
          variants={{
            expanded: {height: "auto", opacity: 1},
            collapsed: {height: 0, opacity: 0},
          }}
          transition={{
            height: {duration: 0.2, ease: [0.22, 1, 0.36, 1]},
            opacity: {duration: 0.12, ease: [0.22, 1, 0.36, 1]},
          }}
          className={cn("overflow-hidden", activityCollapsed && "pointer-events-none")}>
          <div className="pt-0.5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <Tabs
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value as SyncActivityTag);
                  setVisibleCount(initialCount);
                }}>
                <TabsList variant="underline" className="flex-wrap">
                  <TabsTab value="all" className="hit-area-2">
                    All
                  </TabsTab>
                  <TabsTab value="success" className="hit-area-2">
                    Success
                  </TabsTab>
                  <TabsTab value="error" className="hit-area-2">
                    Errors
                  </TabsTab>
                  <TabsTab value="warning" className="hit-area-2">
                    Warnings
                  </TabsTab>
                  <TabsTab value="info" className="hit-area-2">
                    Info
                  </TabsTab>
                </TabsList>
              </Tabs>

              <InputGroup className="w-full max-w-[320px]">
                <InputGroupInput
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setVisibleCount(initialCount);
                  }}
                  aria-label="Search sync activity"
                  placeholder="Search sync activity"
                  type="search"
                  autoComplete="off"
                />
                <InputGroupAddon>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </InputGroupAddon>
              </InputGroup>
            </div>

            {totalCount === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {initialActivity.length === 0
                  ? "No sync activity yet"
                  : "No sync activity matches your filters."}
              </p>
            ) : null}

            <Accordion>
              {visibleActivity.map((item, index) => {
                const currentDayLabel = getSyncActivityDayLabel(item.time);
                const previousDayLabel =
                  index > 0
                    ? getSyncActivityDayLabel(visibleActivity[index - 1]?.time ?? "")
                    : null;
                const showDayLabel = index === 0 || currentDayLabel !== previousDayLabel;

                return (
                  <SyncActivityRow
                    key={item.id}
                    item={item}
                    dayLabel={showDayLabel ? currentDayLabel : null}
                  />
                );
              })}
            </Accordion>

            {showToggle ? (
              <div className="mx-auto flex w-full justify-center pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setVisibleCount((v) => {
                      if (v < totalCount) return Math.min(v + step, totalCount);
                      return initialCount;
                    });
                  }}>
                  {canShowMore ? "Show 10 more" : "Show less"}
                </Button>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SyncActivityRow({item, dayLabel}: {item: SyncActivityItem; dayLabel: string | null}) {
  const providerIcon = getProviderIcon(item.provider);
  const syncedCount = item.status === "success" ? getSyncedItemCount(item.items) : null;

  return (
    <AccordionItem value={item.id} className="border-border/80">
      <div className="hover:bg-muted/25 relative px-0 transition-colors">
        <div className="absolute top-0 bottom-0 left-0 w-px" />
        {dayLabel ? <div className="text-muted-foreground pt-3 text-sm">{dayLabel}</div> : null}

        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex w-full items-start gap-3 md:items-center">
            {providerIcon ? (
              <Image
                src={providerIcon.src}
                alt={item.provider}
                width={20}
                height={20}
                className={cn(providerIcon.invertOnDark && "dark:invert")}
              />
            ) : (
              <div className="size-5 shrink-0" aria-hidden />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <ActivityStatusIcon status={item.status} />
                <p className="text-foreground text-sm font-medium">{item.provider}</p>
                <span className="text-muted-foreground text-sm font-medium">-</span>
                <p className="text-muted-foreground text-sm font-medium">{item.summary}</p>
                {syncedCount !== null ? (
                  <span className="text-foreground rounded-sm border px-1 text-xs">
                    +{syncedCount.toLocaleString()}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 self-center md:gap-3">
              <span className="text-muted-foreground text-[13px]">
                {formatTimeRelativeUtc(item.time)}
              </span>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-3">
          <Alert
            variant={
              item.status === "success"
                ? "success"
                : item.status === "running"
                  ? "info"
                  : item.status === "error"
                    ? "error"
                    : "warning"
            }
            className="rounded-lg py-1.5">
            <AlertTitle className="text-foreground/85">{item.details}</AlertTitle>
          </Alert>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}

function ActivityStatusIcon({status}: {status: SyncActivityStatus}) {
  if (status === "success") {
    return <SuccessCheckIcon className="text-success size-5 shrink-0" aria-hidden />;
  }

  if (status === "running") {
    return <RotatingIcon className="text-info size-5 shrink-0 animate-spin" />;
  }

  if (status === "warning") {
    return <TriangleAlertIcon className="text-warning size-5 shrink-0" aria-hidden />;
  }

  return <CircleXIcon className="text-destructive size-5 shrink-0" aria-hidden />;
}
