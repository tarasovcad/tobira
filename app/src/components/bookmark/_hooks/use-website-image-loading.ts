import {useEffect, useState} from "react";
import type {WebsiteImageStatus} from "@/db/schema";

const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 1200;
const DEFAULT_MAX_RETRIES = 12;
const DEFAULT_RETRY_MS = 2000;

const loadedImageIdentities = new Set<string>();

type ImageLoadingMode = "eager" | "lazy";
type ImageLoadingStatus = "loading" | "loaded" | "error";

type ImageLoadingState = {
  identity: string;
  attempt: number;
  status: ImageLoadingStatus;
};

type WebsiteImageLoadingOptions = {
  baseSrc: string;
  assetVersion?: string;
  assetStatus?: WebsiteImageStatus;
  width?: number;
  height?: number;
  loading?: ImageLoadingMode;
  maxRetries?: number;
  retryMs?: number;
};

function getImageIdentity(baseSrc: string, assetVersion?: string) {
  return `${baseSrc}:${assetVersion ?? ""}`;
}

function isFailedAssetStatus(status: WebsiteImageStatus | undefined) {
  return status === "failed" || status === "missing";
}

function isLoadedImageIdentity(baseSrc: string, identity: string) {
  return Boolean(baseSrc) && loadedImageIdentities.has(identity);
}

export function useWebsiteImageLoading({
  baseSrc,
  assetVersion,
  assetStatus,
  width,
  height,
  loading,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryMs = DEFAULT_RETRY_MS,
}: WebsiteImageLoadingOptions) {
  const imageWidth = width ?? DEFAULT_IMAGE_WIDTH;
  const imageHeight = height ?? DEFAULT_IMAGE_HEIGHT;
  const imageLoading = loading ?? "lazy";
  const hasBaseSrc = Boolean(baseSrc);
  const isPending = assetStatus === "pending";
  const isFailed = isFailedAssetStatus(assetStatus);
  const imageIdentity = getImageIdentity(baseSrc, assetVersion);
  const cachedLoaded = isLoadedImageIdentity(baseSrc, imageIdentity);

  const [state, setState] = useState<ImageLoadingState>({
    identity: imageIdentity,
    attempt: 0,
    status: cachedLoaded ? "loaded" : "loading",
  });
  const attempt = state.identity === imageIdentity ? state.attempt : 0;
  const status = cachedLoaded
    ? "loaded"
    : state.identity === imageIdentity
      ? state.status
      : "loading";
  const hasValidImage = hasBaseSrc && status === "loaded";
  const showSkeleton = hasBaseSrc && !hasValidImage && (isPending || !assetStatus);
  const shouldRetry = hasBaseSrc && !isPending && !isFailed && status === "error";

  useEffect(() => {
    if (!shouldRetry) return;
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
  }, [attempt, imageIdentity, maxRetries, retryMs, shouldRetry]);

  const markImageLoaded = () => {
    if (hasBaseSrc) {
      loadedImageIdentities.add(imageIdentity);
    }

    setState((current) => {
      if (
        current.identity === imageIdentity &&
        current.attempt === attempt &&
        current.status === "loaded"
      ) {
        return current;
      }

      return {identity: imageIdentity, attempt, status: "loaded"};
    });
  };
  const markImageFailed = () => {
    setState((current) => {
      if (
        current.identity === imageIdentity &&
        current.attempt === attempt &&
        current.status === "error"
      ) {
        return current;
      }

      return {identity: imageIdentity, attempt, status: "error"};
    });
  };

  return {
    attempt,
    status,
    imageWidth,
    imageHeight,
    imageLoading,
    isFailed,
    hasValidImage,
    showSkeleton,
    markLoaded: markImageLoaded,
    markFailed: markImageFailed,
  };
}
