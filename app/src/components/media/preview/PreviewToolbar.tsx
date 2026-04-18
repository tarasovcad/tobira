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
  expanded: boolean;
  onZoomToggle: () => void;
  onClose: () => void;
  addZoom?: boolean;
};

export function PreviewToolbar({
  zoom,
  expanded,
  onZoomToggle,
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
