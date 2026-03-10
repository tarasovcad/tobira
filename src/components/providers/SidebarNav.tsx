import React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils";

export const NavItem = ({
  isActive,
  icon,
  label,
  href,
  className,
  iconSide = "left",
}: {
  isActive: boolean;
  icon?: React.ReactNode;
  label: string;
  href: string;
  className?: string;
  iconSide?: "left" | "right";
}) => {
  return (
    <Link
      href={href}
      className={cn(
        isActive
          ? "text-foreground bg-[#F0F0F0] dark:bg-[#181717]"
          : "text-secondary bg-transparent",
        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
        "hover:bg-muted hover:text-foreground",
        className,
      )}>
      {icon && iconSide === "left" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
      <span className="">{label}</span>
      {icon && iconSide === "right" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
    </Link>
  );
};

export const NAV_ITEMS = [
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10.6479 2.65234C10.2397 2.44922 9.76035 2.44922 9.35219 2.65234L2.47786 6.07287C1.3963 6.61105 1.3963 8.16002 2.47786 8.69817L9.35219 12.1187C9.76035 12.3218 10.2397 12.3218 10.6479 12.1187L17.5222 8.69817C18.6038 8.16002 18.6038 6.61105 17.5222 6.07287L10.6479 2.65234Z"
          fill="currentColor"
        />
        <path
          d="M3.83808 10.625L2.47786 11.3018C1.3963 11.84 1.39629 13.3889 2.47786 13.9271L9.35218 17.3477C9.76035 17.5507 10.2397 17.5507 10.6479 17.3477L17.5222 13.9271C18.6038 13.3889 18.6038 11.84 17.5222 11.3018L16.1619 10.625L10.6479 13.3687C10.2397 13.5718 9.76035 13.5718 9.35218 13.3687L3.83808 10.625Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "All Items",
    href: "/home",
  },
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM12.75 7.75C12.75 7.33579 12.4142 7 12 7C11.5858 7 11.25 7.33579 11.25 7.75V12C11.25 12.1989 11.329 12.3897 11.4697 12.5303L14.2197 15.2803C14.5126 15.5732 14.9874 15.5732 15.2803 15.2803C15.5732 14.9874 15.5732 14.5126 15.2803 14.2197L12.75 11.6893V7.75Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Recent",
    href: "/recent",
  },
  {
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M11.3245 1.66454C10.7912 0.556155 9.20781 0.556155 8.67456 1.66454L6.86368 5.42816C6.83245 5.49308 6.76926 5.5397 6.69416 5.54952L2.52885 6.09405C1.30664 6.25383 0.806898 7.75978 1.71091 8.61084L4.75525 11.4769C4.80877 11.5273 4.83199 11.6 4.81892 11.67L4.05425 15.7654C3.82669 16.9843 5.11807 17.9028 6.1972 17.322L9.89373 15.3323C9.95956 15.2968 10.0395 15.2968 10.1053 15.3323L13.8018 17.322C14.881 17.9028 16.1724 16.9843 15.9448 15.7654L15.1801 11.67C15.1671 11.6 15.1903 11.5273 15.2438 11.4769L18.2881 8.61084C19.1921 7.75978 18.6924 6.25383 17.4702 6.09405L13.3049 5.54952C13.2298 5.5397 13.1666 5.49308 13.1354 5.42816L11.3245 1.66454Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Favorites",
    href: "/favorites",
  },
];
