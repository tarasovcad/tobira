import React from "react";
import Link from "next/link";
import {cn} from "@/lib/utils/classnames";
import {TooltipTrigger} from "@/components/coss-ui/tooltip";

export const NavItem = ({
  isActive,
  icon,
  label,
  href,
  className,
  iconSide = "left",
  disabled,
  collapsed = false,
  tooltipHandle,
}: {
  isActive: boolean;
  icon?: React.ReactNode;
  label: string;
  href: string;
  className?: string;
  iconSide?: "left" | "right";
  disabled?: boolean;
  collapsed?: boolean;
  tooltipHandle?: React.ComponentProps<typeof TooltipTrigger>["handle"];
}) => {
  const TooltipLabel = () => <span>{label}</span>;

  const content = (
    <>
      {icon && iconSide === "left" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
      <span
        className={cn(
          "truncate overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-25 ease-linear",
          collapsed ? "ml-0 max-w-0 opacity-0" : "ml-2 opacity-100",
        )}>
        {label}
      </span>
      {icon && iconSide === "right" && (
        <span className="inline-flex size-5 shrink-0 items-center justify-center text-current">
          {icon}
        </span>
      )}
    </>
  );

  const baseStyles = cn(
    isActive ? "text-foreground bg-muted-strong" : "text-secondary bg-transparent",
    "flex w-full items-center rounded-md py-2 text-sm font-medium",
    collapsed ? "justify-start px-2" : "justify-start px-3",
    "transition-[padding] duration-50 ease-linear",
    "focus-visible:ring-ring focus-visible:ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
    disabled
      ? "opacity-70 cursor-not-allowed select-none"
      : "hover:bg-muted hover:text-foreground cursor-pointer",
    className,
  );

  if (disabled) {
    if (tooltipHandle) {
      return (
        <TooltipTrigger
          className="after:absolute after:left-full after:h-full after:w-2"
          handle={tooltipHandle}
          payload={TooltipLabel}
          render={<div className={baseStyles} aria-disabled="true" />}>
          {content}
        </TooltipTrigger>
      );
    }

    return (
      <div className={baseStyles} aria-disabled="true">
        {content}
      </div>
    );
  }

  if (tooltipHandle) {
    return (
      <TooltipTrigger
        className="after:absolute after:left-full after:h-full after:w-2"
        handle={tooltipHandle}
        payload={TooltipLabel}
        render={<Link href={href} className={baseStyles} />}>
        {content}
      </TooltipTrigger>
    );
  }

  return (
    <Link href={href} className={baseStyles}>
      {content}
    </Link>
  );
};

type NavConfigItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
  disabled?: boolean;
};

export const NAV_ITEMS: NavConfigItem[] = [
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
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M2.50033 2.5C2.04009 2.5 1.66699 2.8731 1.66699 3.33333V5C1.66699 5.46023 2.04009 5.83333 2.50033 5.83333H17.5003C17.9606 5.83333 18.3337 5.46023 18.3337 5V3.33333C18.3337 2.8731 17.9606 2.5 17.5003 2.5H2.50033Z"
          fill="currentColor"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M17.5 7.5H2.5V12.7011C2.49999 13.3719 2.49998 13.9255 2.53683 14.3765C2.5751 14.8449 2.65723 15.2755 2.86331 15.68C3.18289 16.3072 3.69283 16.8171 4.32003 17.1367C4.72448 17.3427 5.15507 17.4249 5.62348 17.4632C6.07448 17.5 6.62812 17.5 7.29894 17.5H12.7011C13.3719 17.5 13.9255 17.5 14.3765 17.4632C14.8449 17.4249 15.2755 17.3427 15.68 17.1367C16.3072 16.8171 16.8171 16.3072 17.1367 15.68C17.3427 15.2755 17.4249 14.8449 17.4632 14.3765C17.5 13.9255 17.5 13.3719 17.5 12.7011V7.5ZM7.5 10C7.5 9.53975 7.8731 9.16667 8.33333 9.16667H11.6667C12.1269 9.16667 12.5 9.53975 12.5 10C12.5 10.4602 12.1269 10.8333 11.6667 10.8333H8.33333C7.8731 10.8333 7.5 10.4602 7.5 10Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Unsorted",
    disabled: true,
    href: "/unsorted",
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
    disabled: true,
    href: "/favorites",
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
          d="M10.0003 17.9167C8.38949 17.9167 7.08366 16.6108 7.08366 15C7.08366 13.6789 7.96241 12.5641 9.16699 12.2054V10.8333H7.50033C5.76033 10.8333 4.33316 9.50009 4.18166 7.79951C2.96941 7.44559 2.08366 6.32651 2.08366 5.00001C2.08366 3.38917 3.38949 2.08334 5.00033 2.08334C6.61116 2.08334 7.91699 3.38917 7.91699 5.00001C7.91699 6.31142 7.05149 7.42109 5.86049 7.78809C5.99716 8.57109 6.67824 9.16667 7.50033 9.16667L12.5003 9.16667C13.3225 9.16667 14.0044 8.57117 14.141 7.78809C12.9496 7.42126 12.0837 6.31176 12.0837 5.00001C12.0837 3.38917 13.3895 2.08334 15.0003 2.08334C16.6112 2.08334 17.917 3.38917 17.917 5.00001C17.917 6.32626 17.0317 7.44534 15.8198 7.79951C15.6684 9.50009 14.2403 10.8333 12.5003 10.8333H10.8337V12.2054C12.0383 12.5641 12.917 13.6789 12.917 15C12.917 16.6108 11.6112 17.9167 10.0003 17.9167Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Graph",
    disabled: true,
    href: "/graph",
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
          d="M18.0968 11.978C18.2512 11.3439 18.333 10.6815 18.333 9.99991C18.333 5.67882 15.0441 2.12586 10.833 1.70776V9.41066L18.0968 11.978Z"
          fill="currentColor"
        />
        <path
          d="M17.5421 13.5494L9.72266 10.7857C9.38966 10.6679 9.16699 10.3532 9.16699 9.99991V1.70776C4.95589 2.12586 1.66699 5.67882 1.66699 9.99991C1.66699 14.6023 5.39795 18.3332 10.0003 18.3332C13.3332 18.3332 16.2092 16.3767 17.5421 13.5494Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Analytics",
    disabled: true,
    href: "/analytics",
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
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.81631 6.77022C5.66964 4.75127 7.66835 3.33333 9.99967 3.33333C12.9768 3.33333 15.4138 5.64618 15.6117 8.57308C17.6157 8.82299 19.1663 10.5325 19.1663 12.6042C19.1663 14.8478 17.3475 16.6667 15.1038 16.6667H5.83301C3.07158 16.6667 0.833008 14.4281 0.833008 11.6667C0.833008 9.25341 2.54219 7.2402 4.81631 6.77022ZM9.37467 7.29166C9.37467 6.94649 9.65451 6.66666 9.99967 6.66666C10.3448 6.66666 10.6247 6.94649 10.6247 7.29166V12.0327L11.6411 11.0164C11.8852 10.7723 12.2808 10.7723 12.5249 11.0164C12.769 11.2605 12.769 11.6562 12.5249 11.9002L10.4416 13.9836C10.1975 14.2277 9.80184 14.2277 9.55776 13.9836L7.4744 11.9002C7.23033 11.6562 7.23033 11.2605 7.4744 11.0164C7.71847 10.7723 8.11421 10.7723 8.35826 11.0164L9.37467 12.0327V7.29166Z"
          fill="currentColor"
        />
      </svg>
    ),
    label: "Sync",
    disabled: false,
    href: "/sync",
  },
];
