"use client";

import {Button} from "@/components/coss-ui/button";
import Link from "next/link";

export function CollectionNotFoundState() {
  return (
    <div className="mx-auto flex min-h-0 max-w-[330px] flex-1 items-center justify-center px-6 py-10">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="bg-muted/50 mb-3 flex items-center justify-center rounded-full p-3">
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9.04179 2.33333C6.62554 2.33333 4.66679 4.29208 4.66679 6.70833V15.8996L1.7411 16.9699C1.28728 17.136 1.05397 17.6385 1.22001 18.0923C1.38604 18.5461 1.88855 18.7794 2.34238 18.6133L26.259 9.86338C26.7128 9.69735 26.9462 9.19485 26.7801 8.74101C26.6141 8.28719 26.1116 8.05388 25.6578 8.21992L23.3335 9.07028V6.70833C23.3335 4.29208 21.3747 2.33333 18.9585 2.33333H9.04179Z"
              fill="currentColor"
            />
            <path
              d="M4.6665 23.6267V19.6265L23.3332 12.7972V23.6267C23.3332 25.2615 21.5077 26.2333 20.1514 25.3204L15.4656 22.1664C14.5794 21.5699 13.4202 21.5699 12.534 22.1663L7.84823 25.3204C6.49205 26.2333 4.6665 25.2615 4.6665 23.6267Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="text-foreground text-xl font-medium tracking-tight">Collection not found</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          We couldn&apos;t find this collection. It might have been deleted, or the link is
          incorrect
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
