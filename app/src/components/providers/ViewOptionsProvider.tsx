"use client";

import {useEffect, useState, type ReactNode} from "react";
import {createViewOptionsStore, ViewOptionsStoreContext} from "@/store/use-view-options";
import {
  getViewOptionsCookie,
  parseViewOptionsCookie,
  writeViewOptionsCookie,
} from "@/lib/view-options-cookie-client";

const VIEW_OPTIONS_COOKIE_WRITE_DEBOUNCE_MS = 200;

export function ViewOptionsProvider({
  initialCookieValue,
  children,
}: {
  initialCookieValue?: string | null;
  children: ReactNode;
}) {
  const [store] = useState(() =>
    createViewOptionsStore(parseViewOptionsCookie(initialCookieValue)),
  );

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const writeCurrentViewOptionsCookie = () => {
      writeViewOptionsCookie(getViewOptionsCookie(store.getState()));
    };

    const scheduleCookieWrite = () => {
      if (timeout !== null) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        timeout = null;
        writeCurrentViewOptionsCookie();
      }, VIEW_OPTIONS_COOKIE_WRITE_DEBOUNCE_MS);
    };

    const flushCookieWrite = () => {
      if (timeout === null) {
        return;
      }

      clearTimeout(timeout);
      timeout = null;
      writeCurrentViewOptionsCookie();
    };

    const unsubscribe = store.subscribe(scheduleCookieWrite);
    window.addEventListener("pagehide", flushCookieWrite);

    if (initialCookieValue) {
      writeViewOptionsCookie(getViewOptionsCookie(store.getState()));
    }

    return () => {
      unsubscribe();
      window.removeEventListener("pagehide", flushCookieWrite);
      flushCookieWrite();
    };
  }, [initialCookieValue, store]);

  return (
    <ViewOptionsStoreContext.Provider value={store}>{children}</ViewOptionsStoreContext.Provider>
  );
}
