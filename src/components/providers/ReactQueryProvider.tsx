"use client";

import {QueryClient, QueryClientProvider, isServer} from "@tanstack/react-query";
import {makeQueryClient} from "@/lib/react-query";

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  } else {
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function ReactQueryProvider({children}: {children: React.ReactNode}) {
  const queryClient = getQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
