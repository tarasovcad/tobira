import {useEffect} from "react";

export const CROSS_FADE_DURATION_MS = 167;
export const PLACEHOLDER_DONE_DELAY_MS = 300;
export const FAST_DELAY_FACTOR = 1 / 3;

export function getFastDelay(delay: number) {
  return Math.round(delay * FAST_DELAY_FACTOR);
}

export function usePlaceholderDone(loaded: boolean, onDone: () => void) {
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(onDone, PLACEHOLDER_DONE_DELAY_MS);
    return () => clearTimeout(t);
  }, [loaded, onDone]);
}

export function usePlaceholderTransition() {
  return {
    CROSS_FADE_DURATION_MS,
    PLACEHOLDER_DONE_DELAY_MS,
    FAST_DELAY_FACTOR,
    getFastDelay,
    usePlaceholderDone,
  };
}
