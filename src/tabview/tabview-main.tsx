import React from "react";
import ReactDOM from "react-dom/client";
import { Electroview } from "electrobun/view";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import type { TabRPC } from "../stubs/types";
import { router } from "./app/router";
import "./app/index.css";

const tabId = new URLSearchParams(window.location.search).get("tabId") ?? "unknown";
const webviewId: number = (window as any).__electrobunWebviewId;

// Tab RPC — connects this OOPIF to the Bun process
export const rpc = Electroview.defineRPC<TabRPC>({
  handlers: {
    requests: {},
    messages: {},
  },
});

new Electroview({ rpc });
(window as any).__demoRpc = rpc;

// Register with Bun so it can target this tab by tabId
if (webviewId !== undefined) {
  rpc.request.registerTab({ tabId, webviewId });
  window.addEventListener("beforeunload", () => {
    rpc.request.unregisterTab({ tabId });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
