// Cross-process RPC type contracts for ElectrobunDemo.

export type Tab = {
  id: string;
  label: string;
};

// ── Shell RPC (Bun ↔ Shell/mainview) ─────────────────────────────────────────

export type ShellRPC = {
  webview: {
    requests: Record<never, never>
    messages: {
      /** Bun pushes the authoritative tab state after every mutation */
      tabState: { tabs: Tab[]; activeTabId: string }
    }
  }
  bun: {
    requests: Record<never, never>
    messages: {
      /** Shell forwards user interactions — Bun mutates state and pushes tabState back */
      tabAction: TabAction
    }
  }
}

export type TabAction =
  | { type: "add" }
  | { type: "close";    id: string }
  | { type: "activate"; id: string }
  | { type: "reopen" }
  | { type: "prev" }
  | { type: "next" }
  | { type: "byIndex";  index: number }  // 0-based

// ── Tab RPC (Bun ↔ each OOPIF tab) ───────────────────────────────────────────

export type TabRPC = {
  webview: {
    requests: Record<never, never>
    messages: Record<never, never>
  }
  bun: {
    requests: {
      registerTab:   { params: { tabId: string; webviewId: number }; response: void }
      unregisterTab: { params: { tabId: string }; response: void }
      ping:          { params: { message: string }; response: { pong: string } }
      get_system_info: {
        params: Record<never, never>
        response: { platform: string; arch: string; bunVersion: string; cwd: string; pid: number }
      }
      open_file_dialog: { params: Record<never, never>; response: { files: string[] } }
      open_external:    { params: { url: string }; response: void }
    }
    messages: Record<never, never>
  }
}
