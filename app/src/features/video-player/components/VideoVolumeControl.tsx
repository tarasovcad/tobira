"use client";

import React, {useEffect, useRef, useState} from "react";

type VideoVolumeControlProps = {
  isMuted: boolean;
  volume: number;
  onToggleMute: () => void;
  onSetVolume: (nextVolume: number, options?: {commit?: boolean}) => void;
};

export function VideoVolumeControl({
  isMuted,
  volume,
  onToggleMute,
  onSetVolume,
}: VideoVolumeControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const volumePercent = Math.max(0, Math.min(100, volume * 100));
  const isSilent = isMuted || volume === 0;

  const updateVolumeVisual = (nextVolume: number) => {
    const nextPercent = Math.max(0, Math.min(100, nextVolume * 100));
    sliderRef.current?.style.setProperty("--video-volume-percent", `${nextPercent}%`);
    sliderRef.current?.setAttribute("aria-valuenow", `${Math.round(nextPercent)}`);
  };

  const getVolumeFromEvent = (clientY: number, currentTarget: EventTarget & HTMLDivElement) => {
    const rect = currentTarget.getBoundingClientRect();
    if (rect.height <= 0) return null;

    let nextVolume = (rect.bottom - clientY) / rect.height;
    nextVolume = Math.max(0, Math.min(1, nextVolume));

    return nextVolume;
  };

  const updateVolumeFromEvent = (
    clientY: number,
    currentTarget: EventTarget & HTMLDivElement,
    options?: {commit?: boolean},
  ) => {
    const nextVolume = getVolumeFromEvent(clientY, currentTarget);
    if (nextVolume === null) return;

    updateVolumeVisual(nextVolume);
    onSetVolume(nextVolume, options);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateVolumeFromEvent(event.clientY, event.currentTarget, {commit: false});
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    updateVolumeFromEvent(event.clientY, event.currentTarget, {commit: false});
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const nextVolume = getVolumeFromEvent(event.clientY, event.currentTarget);
    if (nextVolume !== null) {
      updateVolumeVisual(nextVolume);
      onSetVolume(nextVolume, {commit: true});
    }

    setIsDragging(false);
    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "ArrowUp":
      case "ArrowRight":
        event.preventDefault();
        onSetVolume(volume + 0.05);
        break;
      case "ArrowDown":
      case "ArrowLeft":
        event.preventDefault();
        onSetVolume(volume - 0.05);
        break;
      case "Home":
        event.preventDefault();
        onSetVolume(0);
        break;
      case "End":
        event.preventDefault();
        onSetVolume(1);
        break;
      case "m":
      case "M":
        event.preventDefault();
        onToggleMute();
        break;
    }
  };

  useEffect(() => {
    if (isDraggingRef.current) return;
    updateVolumeVisual(volume);
  }, [volume]);

  return (
    <div className="group/volume relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isSilent ? "Unmute" : "Mute"}
        aria-pressed={isSilent}
        className="group/play relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 ease-linear before:absolute before:size-6 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.97]">
        <div
          className={`transition-all duration-200 ${
            isSilent ? "scale-100 opacity-100 blur-none" : "scale-70 opacity-0 blur-[2px]"
          }`}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6.47959 2.39899C7.34804 1.67529 8.6665 2.29284 8.6665 3.42329V12.5765C8.6665 13.707 7.34804 14.3245 6.47959 13.6009L3.94389 11.4878C3.82408 11.3879 3.67306 11.3333 3.5171 11.3333H2.6665C1.56194 11.3333 0.666504 10.4378 0.666504 9.33327V6.66659C0.666504 5.56202 1.56194 4.66659 2.6665 4.66659H3.5171C3.67306 4.66659 3.82408 4.61191 3.94389 4.51207L6.47959 2.39899Z"
              fill="currentColor"
            />
            <path
              d="M14.8049 7.138C15.0652 6.87766 15.0652 6.45554 14.8049 6.19518C14.5446 5.93484 14.1224 5.93484 13.8621 6.19518L12.9193 7.138L11.9764 6.19518C11.7161 5.93484 11.294 5.93484 11.0336 6.19518C10.7733 6.45554 10.7733 6.87766 11.0336 7.138L11.9764 8.0808L11.0336 9.0236C10.7733 9.28393 10.7733 9.70606 11.0336 9.9664C11.294 10.2268 11.7161 10.2268 11.9764 9.9664L12.9193 9.0236L13.8621 9.9664C14.1224 10.2268 14.5446 10.2268 14.8049 9.9664C15.0652 9.70606 15.0652 9.28393 14.8049 9.0236L13.8621 8.0808L14.8049 7.138Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div
          className={`absolute transition-all duration-200 ${
            isSilent ? "scale-0 opacity-0 blur-[2px]" : "scale-100 opacity-100 blur-none"
          }`}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.6665 3.42329C8.6665 2.29284 7.34804 1.67529 6.47959 2.39899L3.94389 4.51207C3.82408 4.61191 3.67306 4.66659 3.5171 4.66659H2.6665C1.56194 4.66659 0.666504 5.56202 0.666504 6.66659V9.33327C0.666504 10.4378 1.56194 11.3333 2.6665 11.3333H3.5171C3.67306 11.3333 3.82408 11.3879 3.94389 11.4878L6.47959 13.6009C7.34804 14.3245 8.6665 13.707 8.6665 12.5765V3.42329Z"
              fill="currentColor"
            />
            <path
              d="M13.1855 2.81506C12.9251 2.55471 12.503 2.55471 12.2426 2.81506C11.9823 3.07541 11.9823 3.49752 12.2426 3.75786C13.3291 4.84438 14 6.34347 14 8.00054C14 9.65754 13.3291 11.1566 12.2426 12.2431C11.9823 12.5035 11.9823 12.9256 12.2426 13.1859C12.503 13.4463 12.9251 13.4463 13.1855 13.1859C14.5118 11.8596 15.3333 10.0253 15.3333 8.00054C15.3333 5.97565 14.5118 4.1414 13.1855 2.81506Z"
              fill="currentColor"
            />
            <path
              d="M11.0644 4.93615C10.804 4.6758 10.3819 4.6758 10.1216 4.93615C9.86117 5.1965 9.86117 5.61861 10.1216 5.87896C10.6652 6.42258 11.0002 7.17167 11.0002 8.00027C11.0002 8.82887 10.6652 9.578 10.1216 10.1216C9.86117 10.3819 9.86117 10.8041 10.1216 11.0644C10.3819 11.3247 10.804 11.3247 11.0644 11.0644C11.8478 10.2809 12.3336 9.19674 12.3336 8.00027C12.3336 6.80387 11.8478 5.7196 11.0644 4.93615Z"
              fill="currentColor"
            />
          </svg>
        </div>
      </button>

      <div
        className={`pointer-events-none absolute bottom-full left-1/2 z-30 hidden -translate-x-1/2 translate-y-1 pb-2 opacity-0 transition duration-150 ease-out group-focus-within/volume:pointer-events-auto group-focus-within/volume:translate-y-0 group-focus-within/volume:opacity-100 group-hover/volume:pointer-events-auto group-hover/volume:translate-y-0 group-hover/volume:opacity-100 @min-[365px]/video-player:flex ${
          isDragging ? "pointer-events-auto translate-y-0 opacity-100" : ""
        }`}>
        <div className="rounded-full border border-white/10 bg-black/40 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.32)] backdrop-blur-md">
          <div
            ref={sliderRef}
            role="slider"
            tabIndex={0}
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volumePercent)}
            aria-orientation="vertical"
            className="hit-area-3 relative flex h-24 w-4 cursor-pointer items-center justify-center py-2.5 outline-hidden"
            style={{"--video-volume-percent": `${volumePercent}%`} as React.CSSProperties}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}>
            <div className="relative h-full w-1 rounded-full bg-white/22">
              <div
                className="absolute bottom-0 left-0 w-full rounded-full bg-white"
                style={{height: "var(--video-volume-percent)"}}
              />
              <div
                className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
                style={{bottom: "calc(var(--video-volume-percent) - 0.5rem)"}}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
