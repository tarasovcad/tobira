import {useEffect, useState} from "react";
import type {WebsiteImageStatus} from "@/db/schema";

const DEFAULT_MAX_RETRIES = 12;
const DEFAULT_RETRY_MS = 2000;
type ImageLoadingState = {
  identity: string;
  attempt: number;
  status: "loading" | "loaded" | "error";
};

export function useWebsiteImageLoading({
  baseSrc,
  assetVersion,
  assetStatus,
  width,
  height,
  loading,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryMs = DEFAULT_RETRY_MS,
}: {
  baseSrc: string;
  assetVersion?: string;
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
  const imageIdentity = `${baseSrc}:${assetVersion ?? ""}`;

  const [state, setState] = useState<ImageLoadingState>({
    identity: imageIdentity,
    attempt: 0,
    status: "loading",
  });
  const attempt = state.identity === imageIdentity ? state.attempt : 0;
  const status = state.identity === imageIdentity ? state.status : "loading";
  const hasValidImage = !!baseSrc && status === "loaded";
  const showSkeleton = !!baseSrc && !hasValidImage && (isPending || !assetStatus);

  useEffect(() => {
    if (!baseSrc) return;
    if (isPending) return;
    if (isFailed) return;
    if (status !== "error") return;
    if (attempt >= maxRetries) return;

    const timer = window.setTimeout(() => {
      setState((current) => {
        if (current.identity !== imageIdentity) return current;

        return {
          identity: imageIdentity,
          attempt: current.attempt + 1,
          status: "loading",
        };
      });
    }, retryMs);

    return () => window.clearTimeout(timer);
  }, [attempt, baseSrc, imageIdentity, isFailed, isPending, maxRetries, retryMs, status]);

  return {
    attempt,
    status,
    imageWidth,
    imageHeight,
    imageLoading,
    isFailed,
    hasValidImage,
    showSkeleton,
    markLoaded: () => setState({identity: imageIdentity, attempt, status: "loaded"}),
    markFailed: () => setState({identity: imageIdentity, attempt, status: "error"}),
  };
}
