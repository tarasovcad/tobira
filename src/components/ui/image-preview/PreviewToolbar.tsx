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
      className={`flex h-11.5 w-11.5 items-center justify-center text-white/90 transition-colors hover:bg-white/8 ${
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
};

export function PreviewToolbar({
  zoom,
  isFullscreen,
  expanded,
  onZoomToggle,
  onToggleFullscreen,
  onClose,
}: PreviewToolbarProps) {
  return (
    <div
      className={`absolute top-5 right-5 z-10 flex items-center overflow-hidden rounded-md border border-white/20 bg-[#2d2f36]/95 shadow-xl backdrop-blur-sm transition-opacity duration-250 ${
        expanded ? "opacity-100" : "opacity-0"
      }`}>
      <ToolbarButton
        label={zoom > MIN_ZOOM ? "Zoom out" : "Zoom in"}
        onClick={onZoomToggle}
        disabled={!expanded}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          {zoom > MIN_ZOOM ? (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 12.8487 18.3729 14.551 17.3199 15.9056L20.7069 19.2927C21.0974 19.6832 21.0974 20.3164 20.7069 20.7069C20.3164 21.0974 19.6832 21.0974 19.2927 20.7069L15.9056 17.3199C14.551 18.3729 12.8487 19 11 19C6.58172 19 3 15.4183 3 11ZM8 10C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H14C14.5523 12 15 11.5523 15 11C15 10.4477 14.5523 10 14 10H8Z"
              fill="currentColor"
            />
          ) : (
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11C19 12.8487 18.3729 14.551 17.3199 15.9056L20.7069 19.2927C21.0974 19.6832 21.0974 20.3164 20.7069 20.7069C20.3164 21.0974 19.6832 21.0974 19.2927 20.7069L15.9056 17.3199C14.551 18.3729 12.8487 19 11 19C6.58172 19 3 15.4183 3 11ZM12 8C12 7.44772 11.5523 7 11 7C10.4477 7 10 7.44772 10 8V10H8C7.44772 10 7 10.4477 7 11C7 11.5523 7.44772 12 8 12H10V14C10 14.5523 10.4477 15 11 15C11.5523 15 12 14.5523 12 14V12H14C14.5523 12 15 11.5523 15 11C15 10.4477 14.5523 10 14 10H12V8Z"
              fill="currentColor"
            />
          )}
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Slideshow">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M11.1967 2.71828C8.53683 0.970353 5 2.8783 5 6.0611V17.9387C5 21.1215 8.53684 23.0294 11.1967 21.2815L20.234 15.3427C22.6384 13.7627 22.6384 10.2371 20.234 8.65706L11.1967 2.71828Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton
        label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        onClick={onToggleFullscreen}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8.79297 13.793C9.18349 13.4024 9.81651 13.4024 10.207 13.793C10.5976 14.1835 10.5976 14.8165 10.207 15.207L7.41406 18H9C9.55228 18 10 18.4477 10 19C10 19.5523 9.55228 20 9 20H5C4.44772 20 4 19.5523 4 19V15C4 14.4477 4.44772 14 5 14C5.55228 14 6 14.4477 6 15V16.5859L8.79297 13.793Z"
            fill="currentColor"
          />
          <path
            d="M13.793 13.793C14.1835 13.4024 14.8164 13.4024 15.2069 13.793L17.9999 16.5859V15C17.9999 14.4477 18.4476 14 18.9999 14C19.5522 14 19.9999 14.4477 19.9999 15V19C19.9999 19.5523 19.5522 20 18.9999 20H14.9999C14.4476 20 13.9999 19.5523 13.9999 19C13.9999 18.4477 14.4476 18 14.9999 18H16.5858L13.793 15.207C13.4024 14.8165 13.4024 14.1835 13.793 13.793Z"
            fill="currentColor"
          />
          <path
            d="M9 4C9.55228 4 10 4.44772 10 5C10 5.55228 9.55228 6 9 6H7.41406L10.207 8.79297C10.5976 9.18349 10.5976 9.81651 10.207 10.207C9.81651 10.5976 9.18349 10.5976 8.79297 10.207L6 7.41406V9C6 9.55228 5.55228 10 5 10C4.44772 10 4 9.55228 4 9V5C4 4.44772 4.44772 4 5 4H9Z"
            fill="currentColor"
          />
          <path
            d="M18.9999 4C19.5522 4 19.9999 4.44772 19.9999 5V9C19.9999 9.55228 19.5522 10 18.9999 10C18.4476 10 17.9999 9.55228 17.9999 9V7.41406L15.2069 10.207C14.8164 10.5976 14.1835 10.5976 13.793 10.207C13.4024 9.81651 13.4024 9.18349 13.793 8.79297L16.5858 6H14.9999C14.4476 6 13.9999 5.55228 13.9999 5C13.9999 4.44772 14.4476 4 14.9999 4H18.9999Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Display mode">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6 3C3.79086 3 2 4.567 2 6.5V13.5C2 15.433 3.79086 17 6 17H18C20.2091 17 22 15.433 22 13.5V6.5C22 4.567 20.2091 3 18 3H6Z"
            fill="currentColor"
          />
          <path
            d="M4 21H5M9 21H10M14 21H15M19 21H20"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Close preview" onClick={onClose} hasRightBorder={false}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M4.11612 4.11612C4.60427 3.62796 5.39573 3.62796 5.88388 4.11612L12 10.2322L18.1161 4.11612C18.6043 3.62796 19.3957 3.62796 19.8839 4.11612C20.372 4.60427 20.372 5.39573 19.8839 5.88388L13.7678 12L19.8839 18.1161C20.372 18.6043 20.372 19.3957 19.8839 19.8839C19.3957 20.372 18.6043 20.372 18.1161 19.8839L12 13.7678L5.88388 19.8839C5.39573 20.372 4.60427 20.372 4.11612 19.8839C3.62796 19.3957 3.62796 18.6043 4.11612 18.1161L10.2322 12L4.11612 5.88388C3.62796 5.39573 3.62796 4.60427 4.11612 4.11612Z"
            fill="currentColor"
          />
        </svg>
      </ToolbarButton>
    </div>
  );
}
