"use client";

import React, {useEffect, useRef} from "react";

type VideoProgressControlProps = {
  currentTime: number;
  duration: number;
  loadedFraction: number;
  formatTime: (timeInSeconds: number) => string;
  onSeek: (nextTime: number) => void;
};

export function VideoProgressControl({
  currentTime,
  duration,
  loadedFraction,
  formatTime,
  onSeek,
}: VideoProgressControlProps) {
  const isDraggingRef = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const hoverTimeRef = useRef<HTMLDivElement>(null);

  const setTrackVariable = (name: string, value: string) => {
    trackRef.current?.style.setProperty(name, value);
  };

  const updateHoverVisuals = (positionPercent: number, nextTime: number) => {
    setTrackVariable("--video-hover-percent", `${positionPercent}%`);
    setTrackVariable("--video-hover-opacity", "1");
    hoverTimeRef.current!.textContent = formatTime(nextTime);
  };

  const updateProgressVisual = (nextTime: number) => {
    const nextPercent = duration > 0 ? (nextTime / duration) * 100 : 0;
    setTrackVariable("--video-progress-percent", `${nextPercent}%`);
  };

  const updateProgressFromEvent = (
    clientX: number,
    currentTarget: EventTarget & HTMLDivElement,
  ) => {
    if (duration <= 0) return;

    const rect = currentTarget.getBoundingClientRect();
    let position = (clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(1, position));
    const nextTime = position * duration;
    const positionPercent = position * 100;

    updateHoverVisuals(positionPercent, nextTime);
    updateProgressVisual(nextTime);
    onSeek(nextTime);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;

    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateProgressFromEvent(event.clientX, event.currentTarget);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    let position = (event.clientX - rect.left) / rect.width;
    position = Math.max(0, Math.min(1, position));
    const positionPercent = position * 100;
    const nextTime = position * duration;

    updateHoverVisuals(positionPercent, nextTime);

    if (isDraggingRef.current) {
      updateProgressVisual(nextTime);
      onSeek(nextTime);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    isDraggingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerLeave = () => {
    if (isDraggingRef.current) return;
    setTrackVariable("--video-hover-opacity", "0");
  };

  useEffect(() => {
    setTrackVariable("--video-buffered-percent", `${loadedFraction * 100}%`);
  }, [loadedFraction]);

  useEffect(() => {
    if (isDraggingRef.current) return;
    const nextPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    setTrackVariable("--video-progress-percent", `${nextPercent}%`);
  }, [currentTime, duration]);

  useEffect(() => {
    setTrackVariable("--video-hover-opacity", "0");
    if (!isDraggingRef.current && hoverTimeRef.current) {
      hoverTimeRef.current.textContent = formatTime(currentTime);
    }
  }, [currentTime, formatTime]);

  return (
    <div
      className="group/progress mx-1.5 flex min-w-0 flex-1 cursor-pointer items-center py-3 @max-[364px]/video-player:order-first @max-[364px]/video-player:mx-0 @max-[364px]/video-player:basis-full @max-[364px]/video-player:py-1"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}>
      <div
        ref={trackRef}
        className="relative flex h-2 w-full items-center rounded-full bg-white/30 @max-[364px]/video-player:h-1"
        style={
          {
            "--video-buffered-percent": `${loadedFraction * 100}%`,
            "--video-hover-opacity": "0",
            "--video-hover-percent": "0%",
            "--video-progress-percent": duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
          } as React.CSSProperties
        }>
        <div
          className="pointer-events-none absolute -top-8 z-50 -translate-x-1/2 transform"
          style={{left: "var(--video-hover-percent)", opacity: "var(--video-hover-opacity)"}}>
          <div
            ref={hoverTimeRef}
            className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md backdrop-blur-md">
            {formatTime(currentTime)}
          </div>
        </div>

        <div
          className="absolute left-0 h-full rounded-full bg-white/30"
          style={{width: "var(--video-hover-percent)", opacity: "var(--video-hover-opacity)"}}
        />

        <div
          className="absolute left-0 h-full rounded-full bg-white/40"
          style={{width: "var(--video-buffered-percent)"}}
        />

        <div
          className="absolute left-0 h-full rounded-full bg-white"
          style={{width: "var(--video-progress-percent)"}}
        />

        <div
          className="absolute -ml-2 h-4 w-4 scale-0 rounded-full bg-white shadow-sm transition-transform group-hover/progress:scale-100 @max-[364px]/video-player:-ml-1.5 @max-[364px]/video-player:h-3 @max-[364px]/video-player:w-3"
          style={{left: "var(--video-progress-percent)"}}
        />
      </div>
    </div>
  );
}
