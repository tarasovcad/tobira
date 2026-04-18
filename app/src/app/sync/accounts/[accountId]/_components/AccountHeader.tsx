"use client";

import Image from "next/image";
import Link from "next/link";
import {cn} from "@/lib/utils";
import {Button} from "@/components/coss-ui/button";
import NumberFlow from "@number-flow/react";

export type AccountStatus = "healthy" | "syncing" | "warning" | "error";

export type AccountHeaderData = {
  id: string;
  provider: string;
  providerImage: string;
  invertOnDark?: boolean;
  username: string;
  status: AccountStatus;
  connectedSince: string;
  lastSync: string;
  itemsImported: number;
  itemLabel: string;
};

export function AccountHeader({account}: {account: AccountHeaderData}) {
  return (
    <div className="border-b px-6 py-8 pt-6">
      <div className="mb-4">
        <Link
          href="/sync"
          className="text-foreground/80 hover:text-foreground group inline-flex items-center gap-1.5 text-sm font-medium transition-colors">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform group-hover:translate-x-[-2px]"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.13807 3.52859C7.3984 3.78895 7.3984 4.21105 7.13807 4.47141L4.27615 7.33333H13.3333C13.7015 7.33333 14 7.6318 14 8C14 8.3682 13.7015 8.66667 13.3333 8.66667H4.27614L7.13807 11.5286C7.3984 11.7889 7.3984 12.2111 7.13807 12.4714C6.87773 12.7317 6.45561 12.7317 6.19526 12.4714L2.19526 8.4714C2.07024 8.3464 2 8.1768 2 8C2 7.8232 2.07024 7.6536 2.19526 7.5286L6.19526 3.52859C6.45561 3.26825 6.87773 3.26825 7.13807 3.52859Z"
              fill="currentColor"
            />
          </svg>
          Sync
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <div className="flex items-center gap-3">
              <Image
                src={account.providerImage}
                alt={account.provider}
                width={24}
                height={24}
                className={cn("shrink-0", account.invertOnDark && "dark:invert")}
              />
              <div className="flex items-center gap-2">
                <h1 className="text-foreground text-[20px] font-[550]">{account.provider}</h1>
                <span className="text-muted-foreground text-lg font-[450]">{account.username}</span>
              </div>
            </div>
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
            <span>
              {account.itemLabel.charAt(0).toUpperCase() + account.itemLabel.slice(1)}:{" "}
              <NumberFlow value={account.itemsImported} />
            </span>
            <span>Last synced: {account.lastSync}</span>
            <span>Connected: {account.connectedSince}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M4.69563 11.3333C5.54972 12.1573 6.72674 12.6667 8.00041 12.6667C10.5777 12.6667 12.6671 10.5773 12.6671 8.00001C12.6671 7.63181 12.9655 7.33334 13.3337 7.33334C13.7019 7.33334 14.0004 7.63181 14.0004 8.00001C14.0004 11.3137 11.3141 14 8.00041 14C6.48275 14 5.07228 13.4358 4.00033 12.5039V13.3333C4.00033 13.7015 3.70185 14 3.33366 14C2.96547 14 2.66699 13.7015 2.66699 13.3333V11.3333C2.66699 10.5969 3.26395 10 4.00033 10H5.83366C6.20185 10 6.50033 10.2985 6.50033 10.6667C6.50033 11.0349 6.20185 11.3333 5.83366 11.3333H4.69563Z"
                fill="currentColor"
              />
              <path
                d="M3.33333 8C3.33333 8.3682 3.03485 8.66667 2.66667 8.66667C2.29848 8.66667 2 8.3682 2 8C2 4.68629 4.68629 2 8 2C9.52133 2 10.9349 2.56691 12.0078 3.50286V2.66667C12.0078 2.29848 12.3063 2 12.6745 2C13.0427 2 13.3411 2.29848 13.3411 2.66667V4.66667C13.3411 5.40305 12.7442 6 12.0078 6H10.0078C9.6396 6 9.34113 5.70153 9.34113 5.33333C9.34113 4.96514 9.6396 4.66667 10.0078 4.66667H11.3048C10.4507 3.84276 9.27367 3.33333 8 3.33333C5.42267 3.33333 3.33333 5.42267 3.33333 8Z"
                fill="currentColor"
              />
            </svg>
            Reconnect
          </Button>
          <Button variant="destructive-outline">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_544_2368)">
                <path
                  d="M12.667 3.33334L14.667 1.33334"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1.33301 14.6667L3.33301 12.6667"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M4.20002 13.5333C4.34867 13.6825 4.5253 13.8008 4.71978 13.8816C4.91426 13.9624 5.12277 14.0039 5.33336 14.0039C5.54394 14.0039 5.75245 13.9624 5.94693 13.8816C6.14141 13.8008 6.31804 13.6825 6.46669 13.5333L8.00002 12L4.00002 8L2.46669 9.53333C2.31753 9.68198 2.19917 9.85861 2.11842 10.0531C2.03766 10.2476 1.99609 10.4561 1.99609 10.6667C1.99609 10.8772 2.03766 11.0858 2.11842 11.2802C2.19917 11.4747 2.31753 11.6514 2.46669 11.8L4.20002 13.5333Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 9.00001L6.66667 7.33334"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 11L8.66667 9.33334"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 3.99999L12 7.99999L13.5333 6.46666C13.6825 6.31801 13.8008 6.14138 13.8816 5.9469C13.9624 5.75242 14.0039 5.54391 14.0039 5.33333C14.0039 5.12274 13.9624 4.91423 13.8816 4.71975C13.8008 4.52527 13.6825 4.34864 13.5333 4.19999L11.8 2.46666C11.6514 2.3175 11.4747 2.19914 11.2802 2.11839C11.0858 2.03763 10.8772 1.99606 10.6667 1.99606C10.4561 1.99606 10.2476 2.03763 10.0531 2.11839C9.85861 2.19914 9.68198 2.3175 9.53333 2.46666L8 3.99999Z"
                  fill="currentColor"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_544_2368">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
            Disconnect
          </Button>
          <Button variant="outline" size="icon-sm">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.62491 2.06909C6.93134 1.60944 7.44721 1.33334 7.99967 1.33334C8.55214 1.33334 9.06801 1.60944 9.37441 2.06909L9.63247 2.4562C9.89821 2.85472 10.3828 3.04717 10.8495 2.93947L11.1041 2.88072C11.6685 2.75046 12.2603 2.92017 12.6699 3.32979C13.0795 3.73941 13.2492 4.33114 13.1189 4.8956L13.0602 5.15016C12.9525 5.61686 13.1449 6.1015 13.5435 6.36718L13.9306 6.62525C14.3903 6.93168 14.6663 7.44754 14.6663 8.00001C14.6663 8.55248 14.3903 9.06834 13.9306 9.37474L13.5435 9.63281C13.1449 9.89854 12.9525 10.3831 13.0602 10.8499L13.1189 11.1044C13.2492 11.6689 13.0795 12.2606 12.6699 12.6702C12.2603 13.0799 11.6685 13.2495 11.1041 13.1193L10.8495 13.0605C10.3828 12.9529 9.89821 13.1453 9.63247 13.5438L9.37441 13.9309C9.06801 14.3906 8.55214 14.6667 7.99967 14.6667C7.44721 14.6667 6.93134 14.3906 6.62491 13.9309L6.36684 13.5438C6.10116 13.1453 5.61653 12.9529 5.14983 13.0605L4.89526 13.1193C4.33081 13.2495 3.73907 13.0799 3.32945 12.6702C2.91984 12.2606 2.75013 11.6689 2.88039 11.1044L2.93913 10.8499C3.04683 10.3831 2.85439 9.89854 2.45587 9.63281L2.06875 9.37474C1.6091 9.06834 1.33301 8.55248 1.33301 8.00001C1.33301 7.44754 1.6091 6.93168 2.06875 6.62525L2.45587 6.36718C2.85439 6.1015 3.04683 5.61686 2.93913 5.15016L2.88039 4.8956C2.75013 4.33115 2.91983 3.73941 3.32945 3.32979C3.73907 2.92017 4.33081 2.75046 4.89526 2.88072L5.14983 2.93947C5.61653 3.04717 6.10116 2.85472 6.36684 2.4562L6.62491 2.06909ZM5.91634 8.00001C5.91634 6.84941 6.84907 5.91668 7.99967 5.91668C9.15027 5.91668 10.083 6.84941 10.083 8.00001C10.083 9.15061 9.15027 10.0833 7.99967 10.0833C6.84907 10.0833 5.91634 9.15061 5.91634 8.00001Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
