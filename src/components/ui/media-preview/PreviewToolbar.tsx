import type {ReactNode} from "react";
import {MIN_ZOOM} from "./constants";

function ToolbarButton({
  label,
  onClick,
  disabled,
  hasRightBorder = true,
  children,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  hasRightBorder?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex size-10.5 cursor-pointer items-center justify-center text-white/90 transition-colors hover:bg-white/8 ${
        hasRightBorder ? "border-r border-white/15" : ""
      }`}>
      {children}
    </button>
  );
}

type PreviewToolbarProps = {
  zoom: number;
  isFullscreen: boolean;
  expanded: boolean;
  onZoomToggle: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  addZoom?: boolean;
};

export function PreviewToolbar({
  zoom,
  isFullscreen,
  expanded,
  onZoomToggle,
  onToggleFullscreen,
  onClose,
  addZoom = true,
}: PreviewToolbarProps) {
  return (
    <div
      className={`absolute top-5 right-5 z-10 flex items-center overflow-hidden rounded-md border border-white/10 bg-black/40 shadow-xl backdrop-blur-md transition-opacity duration-250 ${
        expanded ? "opacity-100" : "opacity-0"
      }`}>
      {addZoom && (
        <ToolbarButton
          label={zoom > MIN_ZOOM ? "Zoom out" : "Zoom in"}
          onClick={onZoomToggle}
          disabled={!expanded || !addZoom}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            {zoom > MIN_ZOOM ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333C10.7072 15.8333 12.1258 15.3108 13.2547 14.4333L16.0772 17.2557C16.4027 17.5812 16.9303 17.5812 17.2557 17.2557C17.5812 16.9303 17.5812 16.4027 17.2557 16.0772L14.4333 13.2547C15.3108 12.1258 15.8333 10.7072 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5ZM12.5 9.16667C12.5 9.62692 12.1269 10 11.6667 10H6.66667C6.20643 10 5.83333 9.62692 5.83333 9.16667C5.83333 8.70642 6.20643 8.33333 6.66667 8.33333H11.6667C12.1269 8.33333 12.5 8.70642 12.5 9.16667Z"
                fill="currentColor"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.5 9.16667C2.5 5.48477 5.48477 2.5 9.16667 2.5C12.8486 2.5 15.8333 5.48477 15.8333 9.16667C15.8333 10.7072 15.3108 12.1258 14.4333 13.2547L17.2557 16.0772C17.5812 16.4027 17.5812 16.9303 17.2557 17.2557C16.9303 17.5812 16.4027 17.5812 16.0772 17.2557L13.2547 14.4333C12.1258 15.3108 10.7072 15.8333 9.16667 15.8333C5.48477 15.8333 2.5 12.8486 2.5 9.16667ZM10 6.66667C10 6.20643 9.62692 5.83333 9.16667 5.83333C8.70642 5.83333 8.33333 6.20643 8.33333 6.66667V8.33333H6.66667C6.20643 8.33333 5.83333 8.70642 5.83333 9.16667C5.83333 9.62692 6.20643 10 6.66667 10H8.33333V11.6667C8.33333 12.1269 8.70642 12.5 9.16667 12.5C9.62692 12.5 10 12.1269 10 11.6667V10H11.6667C12.1269 10 12.5 9.62692 12.5 9.16667C12.5 8.70642 12.1269 8.33333 11.6667 8.33333H10V6.66667Z"
                fill="currentColor"
              />
            )}
          </svg>
        </ToolbarButton>
      )}
      <ToolbarButton label="Slideshow">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9.33091 2.26523C7.11435 0.808627 4.16699 2.39858 4.16699 5.05092V14.9489C4.16699 17.6012 7.11436 19.1912 9.33091 17.7346L16.862 12.7856C18.8657 11.4689 18.8657 8.53092 16.862 7.21422L9.33091 2.26523Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7.32715 11.4942C7.65258 11.1687 8.1801 11.1687 8.50551 11.4942C8.83101 11.8196 8.83101 12.3471 8.50551 12.6725L6.17806 15H7.49967C7.95991 15 8.33301 15.3731 8.33301 15.8333C8.33301 16.2936 7.95991 16.6667 7.49967 16.6667H4.16634C3.70611 16.6667 3.33301 16.2936 3.33301 15.8333V12.5C3.33301 12.0398 3.70611 11.6667 4.16634 11.6667C4.62657 11.6667 4.99967 12.0398 4.99967 12.5V13.8216L7.32715 11.4942Z"
            fill="currentColor"
          />
          <path
            d="M11.4941 11.4942C11.8195 11.1687 12.347 11.1687 12.6725 11.4942L15 13.8216V12.5C15 12.0398 15.373 11.6667 15.8333 11.6667C16.2935 11.6667 16.6666 12.0398 16.6666 12.5V15.8333C16.6666 16.2936 16.2935 16.6667 15.8333 16.6667H12.5C12.0397 16.6667 11.6666 16.2936 11.6666 15.8333C11.6666 15.3731 12.0397 15 12.5 15H13.8215L11.4941 12.6725C11.1686 12.3471 11.1686 11.8196 11.4941 11.4942Z"
            fill="currentColor"
          />
          <path
            d="M7.49967 3.33333C7.95991 3.33333 8.33301 3.70643 8.33301 4.16667C8.33301 4.6269 7.95991 5 7.49967 5H6.17806L8.50551 7.32748C8.83101 7.65291 8.83101 8.18043 8.50551 8.50583C8.1801 8.83133 7.65258 8.83133 7.32715 8.50583L4.99967 6.17838V7.5C4.99967 7.96023 4.62657 8.33333 4.16634 8.33333C3.70611 8.33333 3.33301 7.96023 3.33301 7.5V4.16667C3.33301 3.70643 3.70611 3.33333 4.16634 3.33333H7.49967Z"
            fill="currentColor"
          />
          <path
            d="M15.8333 3.33333C16.2935 3.33333 16.6666 3.70643 16.6666 4.16667V7.5C16.6666 7.96023 16.2935 8.33333 15.8333 8.33333C15.373 8.33333 15 7.96023 15 7.5V6.17838L12.6725 8.50583C12.347 8.83133 11.8195 8.83133 11.4941 8.50583C11.1686 8.18043 11.1686 7.65291 11.4941 7.32748L13.8215 5H12.5C12.0397 5 11.6666 4.6269 11.6666 4.16667C11.6666 3.70643 12.0397 3.33333 12.5 3.33333H15.8333Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Display mode">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.00033 2.5C3.15938 2.5 1.66699 3.80584 1.66699 5.41667V11.25C1.66699 12.8608 3.15938 14.1667 5.00033 14.1667H15.0003C16.8412 14.1667 18.3337 12.8608 18.3337 11.25V5.41667C18.3337 3.80584 16.8412 2.5 15.0003 2.5H5.00033Z"
            fill="currentColor"
          />
          <path
            d="M3.33301 17.5H4.16634M7.49967 17.5H8.33301M11.6663 17.5H12.4997M15.833 17.5H16.6663"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Close preview" onClick={onClose} hasRightBorder={false}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.26627 4.26627C4.62129 3.91124 5.1969 3.91124 5.55192 4.26627L10 8.71433L14.4481 4.26627C14.8031 3.91124 15.3787 3.91124 15.7338 4.26627C16.0887 4.62129 16.0887 5.1969 15.7338 5.55192L11.2857 10L15.7338 14.4481C16.0887 14.8031 16.0887 15.3787 15.7338 15.7338C15.3787 16.0887 14.8031 16.0887 14.4481 15.7338L10 11.2857L5.55192 15.7338C5.1969 16.0887 4.62129 16.0887 4.26627 15.7338C3.91124 15.3787 3.91124 14.8031 4.26627 14.4481L8.71433 10L4.26627 5.55192C3.91124 5.1969 3.91124 4.62129 4.26627 4.26627Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
    </div>
  );
}
