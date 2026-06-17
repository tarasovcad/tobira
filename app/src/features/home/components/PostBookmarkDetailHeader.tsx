"use client";

import {Button} from "@/components/ui/coss/button";

type PostBookmarkDetailHeaderProps = {
  onBack: () => void;
};

const POST_DETAIL_TITLE = "Post";

export function PostBookmarkDetailHeader({onBack}: PostBookmarkDetailHeaderProps) {
  return (
    <header className="bg-background/70 sticky top-0 z-10 flex shrink-0 items-center gap-3 px-6 py-3 backdrop-blur">
      <PostBookmarkDetailBackButton onBack={onBack} />
      <h1 className="text-foreground/95 text-[18px] font-semibold">{POST_DETAIL_TITLE}</h1>
    </header>
  );
}

function PostBookmarkDetailBackButton({onBack}: PostBookmarkDetailHeaderProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Back to posts"
      onClick={onBack}
      className="text-foreground! hover:bg-foreground/7! hit-area-2! rounded-full [&_svg]:opacity-100!">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M7.13807 3.20921C7.3984 3.48816 7.3984 3.94042 7.13807 4.21937L4.27615 7.28572H13.3333C13.7015 7.28572 14 7.60551 14 8.00001C14 8.39451 13.7015 8.7143 13.3333 8.7143H4.27614L7.13807 11.7807C7.3984 12.0596 7.3984 12.5119 7.13807 12.7908C6.87773 13.0697 6.45561 13.0697 6.19526 12.7908L2.19526 8.50508C2.07024 8.37115 2 8.18944 2 8.00001C2 7.81058 2.07024 7.62887 2.19526 7.49494L6.19526 3.20921C6.45561 2.93026 6.87773 2.93026 7.13807 3.20921Z"
          fill="currentColor"
        />
      </svg>
    </Button>
  );
}
