import {SelectionModeButton} from "@/components/bookmark/SelectionModeButton";
import {PageHeader} from "@/components/ui/app/page/PageHeader";
import {Button} from "@/components/ui/coss/button";
import {InputGroup, InputGroupAddon, InputGroupInput} from "@/components/ui/coss/input-group";
import {Skeleton} from "@/components/ui/coss/skeleton";

const stats = ["Tags", "Tagged items", "Updated this week"];

export function TagPageSkeleton() {
  return (
    <div className="flex h-full w-full overflow-auto">
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-scroll py-12">
        <div className="mx-auto max-w-[calc(840px+16px+16px)] space-y-10">
          <div className="px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <PageHeader
                title="Tags"
                description="Keep your growing library in order with custom tags that make every bookmark findable."
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="w-fit" aria-label="Tag actions">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.33301 8C1.33301 7.2636 1.92996 6.66666 2.66634 6.66666C3.40272 6.66666 3.99967 7.2636 3.99967 8C3.99967 8.7364 3.40272 9.33333 2.66634 9.33333C1.92996 9.33333 1.33301 8.7364 1.33301 8ZM6.66634 8C6.66634 7.2636 7.26327 6.66666 7.99967 6.66666C8.73607 6.66666 9.33301 7.2636 9.33301 8C9.33301 8.7364 8.73607 9.33333 7.99967 9.33333C7.26327 9.33333 6.66634 8.7364 6.66634 8ZM11.9997 8C11.9997 7.2636 12.5966 6.66666 13.333 6.66666C14.0694 6.66666 14.6663 7.2636 14.6663 8C14.6663 8.7364 14.0694 9.33333 13.333 9.33333C12.5966 9.33333 11.9997 8.7364 11.9997 8Z"
                      fill="currentColor"
                    />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="border-border mt-4 flex flex-wrap items-center gap-5.5 border-t pt-4">
              {stats.map((stat, index) => (
                <div key={stat} className="contents">
                  {index > 0 && <div className="bg-border h-7 w-px" aria-hidden />}
                  <StatSkeleton label={stat} />
                </div>
              ))}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4">
              <h4 className="text-base font-[550]">
                <span className="text-foreground/95 inline-flex items-center">Your tags</span>
              </h4>

              <div className="flex items-center gap-2">
                <InputGroup className="w-full max-w-[320px]">
                  <InputGroupInput
                    aria-label="Search tags"
                    placeholder="Search tags"
                    type="search"
                    autoComplete="off"
                    readOnly
                  />
                  <InputGroupAddon>
                    <SearchIcon />
                  </InputGroupAddon>
                </InputGroup>
                <SelectionModeButton selectionMode={false} />
                <Button variant="outline" size="default">
                  <FilterIcon />
                  Filter
                </Button>
              </div>
            </div>

            <div className="pt-0.5">
              {Array.from({length: 8}, (_, index) => (
                <div
                  key={index}
                  className="border-border/80 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1fr)_90px_auto] xl:grid-cols-[minmax(0,1fr)_280px_90px_auto]">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <Skeleton className="h-4.5 w-32" />
                      <Skeleton className="h-4.5 w-20" />
                    </div>
                  </div>

                  <div className="hidden min-w-0 xl:block">
                    <Skeleton className="h-4.5 w-52" />
                  </div>

                  <div className="hidden min-w-0 md:block">
                    <Skeleton className="h-4.5 w-14" />
                  </div>

                  <div className="relative z-10 flex h-[28px] shrink-0 items-center gap-1.5">
                    <Skeleton className="size-6" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function StatSkeleton({label}: {label: string}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[12px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <Skeleton className="h-5 w-[32.8px]" />
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M13.3333 13.3333L10.751 10.751M10.751 10.751C11.6257 9.87633 12.1667 8.668 12.1667 7.33333C12.1667 4.66396 10.0027 2.5 7.33333 2.5C4.66396 2.5 2.5 4.66396 2.5 7.33333C2.5 10.0027 4.66396 12.1667 7.33333 12.1667C8.668 12.1667 9.87633 11.6257 10.751 10.751Z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.55229 2C3.1427 2 2 3.1427 2 4.55229C2 5.22919 2.2689 5.87837 2.74755 6.35702L5.60947 9.21893C5.85953 9.469 6 9.80813 6 10.1617V13.3713C6 14.3023 6.9298 14.9467 7.80147 14.6198L9.1348 14.1198C9.65527 13.9246 10 13.4271 10 12.8713V10.1617C10 9.80813 10.1405 9.469 10.3905 9.21893L13.2525 6.35702C13.7311 5.87837 14 5.22919 14 4.55229C14 3.1427 12.8573 2 11.4477 2H4.55229Z"
        fill="currentColor"
      />
    </svg>
  );
}
