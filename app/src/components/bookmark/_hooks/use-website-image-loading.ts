import {useEffect, useState} from "react";
import type {WebsiteImageStatus} from "@/db/schema";

const DEFAULT_MAX_RETRIES = 12;
const DEFAULT_RETRY_MS = 2000;

export function useWebsiteImageLoading({
  baseSrc,
  assetStatus,
  width,
  height,
  loading,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryMs = DEFAULT_RETRY_MS,
}: {
  baseSrc: string;
  assetStatus?: WebsiteImageStatus;
  width?: number;
  height?: number;
  loading?: "eager" | "lazy";
  maxRetries?: number;
  retryMs?: number;
}) {
  const imageWidth = width ?? 1200;
  const imageHeight = height ?? 1200;
  const imageLoading = loading ?? "lazy";
  const isPending = assetStatus === "pending";
  const isFailed = assetStatus === "failed" || assetStatus === "missing";

  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const hasValidImage = !!baseSrc && status === "loaded";
  const showSkeleton = !!baseSrc && !hasValidImage && (isPending || !assetStatus);

  useEffect(() => {
    if (!baseSrc) return;
    if (isPending) return;
    if (isFailed) return;
    if (status !== "error") return;
    if (attempt >= maxRetries) return;

    const timer = window.setTimeout(() => {
      setAttempt((current) => current + 1);
      setStatus("loading");
    }, retryMs);

    return () => window.clearTimeout(timer);
  }, [attempt, baseSrc, isFailed, isPending, maxRetries, retryMs, status]);

  return {
    attempt,
    status,
    imageWidth,
    imageHeight,
    imageLoading,
    isFailed,
    hasValidImage,
    showSkeleton,
    markLoaded: () => setStatus("loaded"),
    markFailed: () => setStatus("error"),
  };
}
