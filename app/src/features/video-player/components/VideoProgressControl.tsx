"use client";

import type {CSSProperties, PointerEvent as ReactPointerEvent} from "react";
import {useEffect, useRef, useState} from "react";

type VideoProgressControlProps = {
  currentTime: number;
  duration: number;
  loadedFraction: number;
  formatTime: (timeInSeconds: number) => string;
  onSeek: (nextTime: number) => void;
};

type PreviewState = {
  percent: number;
  time: number;
};

const getPreviewFromPointer = (clientX: number, element: HTMLDivElement, duration: number) => {
  const rect = element.getBoundingClientRect();
  const position = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));

  return {
    percent: position * 100,
    time: position * duration,
  };
};

export function VideoProgressControl({
  currentTime,
  duration,
  loadedFraction,
  formatTime,
  onSeek,
}: VideoProgressControlProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const pendingSeekTimeRef = useRef<number | null>(null);
  const seekAnimationFrameRef = useRef<number | null>(null);

  const cancelScheduledSeek = () => {
    if (seekAnimationFrameRef.current !== null) {
      cancelAnimationFrame(seekAnimationFrameRef.current);
      seekAnimationFrameRef.current = null;
    }
  };

  const flushPendingSeek = () => {
    const nextTime = pendingSeekTimeRef.current;
    if (nextTime === null) return;

    seekAnimationFrameRef.current = null;
    pendingSeekTimeRef.current = null;
    onSeek(nextTime);
  };

  const scheduleLiveSeek = (nextTime: number) => {
    pendingSeekTimeRef.current = nextTime;

    if (seekAnimationFrameRef.current !== null) return;

    seekAnimationFrameRef.current = requestAnimationFrame(() => {
      flushPendingSeek();
    });
  };

  useEffect(() => {
    return () => {
      cancelScheduledSeek();
    };
  }, []);

  const handlePreviewMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return null;

    const nextPreview = getPreviewFromPointer(event.clientX, event.currentTarget, duration);
    setPreview(nextPreview);
    return nextPreview;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const nextPreview = handlePreviewMove(event);
    if (!nextPreview) return;

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    pendingSeekTimeRef.current = null;
    cancelScheduledSeek();
    onSeek(nextPreview.time);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const nextPreview = handlePreviewMove(event);
    if (!nextPreview || !isDragging) return;

    scheduleLiveSeek(nextPreview.time);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (pendingSeekTimeRef.current !== null) {
      cancelScheduledSeek();
      flushPendingSeek();
    }

    if (!event.currentTarget.matches(":hover")) {
      setPreview(null);
    }
  };

  const handlePointerLeave = () => {
    if (isDragging) return;
    setPreview(null);
  };

  const progressPercent =
    preview && isDragging ? preview.percent : duration > 0 ? (currentTime / duration) * 100 : 0;

  const tooltipTime = preview?.time ?? currentTime;

  const trackStyle = {
    "--video-buffered-percent": `${loadedFraction * 100}%`,
    "--video-hover-opacity": preview ? "1" : "0",
    "--video-hover-percent": `${preview?.percent ?? 0}%`,
    "--video-progress-percent": `${progressPercent}%`,
  } as CSSProperties;

  return (
    <div
      className="group/progress hit-area-2 mx-1.5 flex min-w-0 flex-1 cursor-pointer items-center py-3 @max-[364px]/video-player:order-first @max-[364px]/video-player:mx-0 @max-[364px]/video-player:basis-full @max-[364px]/video-player:py-1"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerUp}>
      <div
        className="relative flex h-2 w-full items-center rounded-full bg-white/30 @max-[364px]/video-player:h-1"
        style={trackStyle}>
        <div
          className="pointer-events-none absolute -top-8 z-50 -translate-x-1/2 transform"
          style={{left: "var(--video-hover-percent)", opacity: "var(--video-hover-opacity)"}}>
          <div className="rounded-md border border-white/10 bg-black/40 px-2 py-1 text-xs font-medium whitespace-nowrap text-white shadow-md backdrop-blur-md">
            {formatTime(tooltipTime)}
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
