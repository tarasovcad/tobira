import {useCallback, useEffect, useRef, useState} from "react";
import {toastManager} from "@/components/coss-ui/toast";

export function useClipboardCopy(timeoutMs: number = 2000, opts?: {toast?: boolean}) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const copyText = useCallback(
    async (text: string, key?: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setCopiedKey(key ?? text);

        if (opts?.toast) {
          toastManager.add({
            title: "Copied to clipboard",
            type: "success",
          });
        }

        return true;
      } finally {
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => setCopiedKey(null), timeoutMs);
      }
    },
    [timeoutMs, opts?.toast],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return {copiedKey, copyText};
}
