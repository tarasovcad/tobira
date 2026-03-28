"use client";

import * as React from "react";
import {Badge} from "@/components/coss-ui/badge";
import {cn} from "@/lib/utils";

export interface TagProps extends React.ComponentProps<typeof Badge> {
  onRemove?: () => void;
  disabled?: boolean;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({children, onRemove, disabled, className, variant = "outline", size = "md", ...props}, ref) => {
    return (
      <Badge
        ref={ref}
        variant={variant}
        size={size}
        className={cn("bg-muted", onRemove && "gap-0!", className)}
        {...props}>
        # {children}
        {onRemove && (
          <button
            type="button"
            className="text-foreground/70 hover:text-foreground cursor-pointer p-1"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRemove();
            }}
            aria-label="Remove tag"
            disabled={disabled}>
            <RemoveIcon />
          </button>
        )}
      </Badge>
    );
  },
);
Tag.displayName = "Tag";

function RemoveIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.05806 2.05806C2.30214 1.81398 2.69787 1.81398 2.94194 2.05806L6 5.1161L9.05805 2.05806C9.30215 1.81398 9.69785 1.81398 9.94195 2.05806C10.186 2.30214 10.186 2.69787 9.94195 2.94194L6.8839 6L9.94195 9.05805C10.186 9.30215 10.186 9.69785 9.94195 9.94195C9.69785 10.186 9.30215 10.186 9.05805 9.94195L6 6.8839L2.94194 9.94195C2.69787 10.186 2.30214 10.186 2.05806 9.94195C1.81398 9.69785 1.81398 9.30215 2.05806 9.05805L5.1161 6L2.05806 2.94194C1.81398 2.69787 1.81398 2.30214 2.05806 2.05806Z"
        fill="currentColor"
      />
    </svg>
  );
}
