"use client";

import {Button} from "@/components/coss-ui/button";
import Link from "next/link";

export function TagNotFoundState({tagName}: {tagName?: string | null}) {
  return (
    <div className="mx-auto flex min-h-0 max-w-[330px] flex-1 items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="bg-muted/50 text-muted-foreground mb-3 flex items-center justify-center rounded-full p-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M2.3335 6.99999C2.3335 4.42266 4.42283 2.33333 7.00016 2.33333H12.5505C13.7881 2.33333 14.975 2.825 15.8503 3.70016L24.3086 12.1585C26.131 13.981 26.131 16.9357 24.3086 18.7581L18.7583 24.3084C16.9358 26.1309 13.9811 26.1309 12.1587 24.3084L3.70033 15.8501C2.82516 14.9749 2.3335 13.7879 2.3335 12.5503V6.99999ZM8.75016 10.5C9.71666 10.5 10.5002 9.7165 10.5002 8.74999C10.5002 7.78349 9.71666 6.99999 8.75016 6.99999C7.78366 6.99999 7.00016 7.78349 7.00016 8.74999C7.00016 9.7165 7.78366 10.5 8.75016 10.5Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="text-foreground text-xl font-medium tracking-tight">
          Tag {tagName ? `"${tagName}" ` : ""}not found
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We couldn&apos;t find this tag. It might have been deleted, or the link is incorrect
        </p>

        <Link href="/home">
          <Button className="group mt-5" variant="default">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="transition-transform group-hover:-translate-x-0.5"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.25593 12.4226C6.93047 12.748 6.40285 12.748 6.07741 12.4226L2.24408 8.58927C2.0878 8.433 2 8.221 2 8C2 7.779 2.08779 7.56707 2.24408 7.41074L6.07741 3.57742C6.40285 3.25198 6.93047 3.25198 7.25593 3.57742C7.58133 3.90285 7.58133 4.43049 7.25593 4.75592L4.84517 7.16667H13.1667C13.6269 7.16667 14 7.5398 14 8C14 8.46027 13.6269 8.83334 13.1667 8.83334H4.84518L7.25593 11.2441C7.58133 11.5695 7.58133 12.0971 7.25593 12.4226Z"
                fill="currentColor"
              />
            </svg>
            Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
