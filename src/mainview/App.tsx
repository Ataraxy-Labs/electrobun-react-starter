import { useState, useEffect, useCallback } from "react";
import { Plus, X, Layers } from "lucide-react";
import { Electroview } from "electrobun/view";
import type { ShellRPC, Tab, TabAction } from "../stubs/types";

// ── Shell RPC (module-level) ──────────────────────────────────────────────────

type SetTabState = ((tabs: Tab[], activeTabId: string) => void) | null;
let _setTabState: SetTabState = null;

const shellRpc = Electroview.defineRPC<ShellRPC>({
  handlers: {
    requests: {},
    messages: {
      tabState: ({ tabs, activeTabId }) => {
        _setTabState?.(tabs, activeTabId);
      },
    },
  },
});
new Electroview({ rpc: shellRpc });

function sendAction(action: TabAction) {
  shellRpc.send("tabAction", action);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type WebviewTagElement = HTMLElement & {
  toggleTransparent(value?: boolean): void;
  togglePassthrough(value?: boolean): void;
  syncDimensions(force?: boolean): void;
};

const webviewRefs = new Map<string, WebviewTagElement>();

function getTabViewUrl(tabId: string): string {
  const base = window.location.hostname === "localhost"
    ? `http://localhost:5173/tabview/index.html`
    : `views://tabview/index.html`;
  return `${base}?tabId=${encodeURIComponent(tabId)}`;
}

function syncVisibility(activeTabId: string) {
  webviewRefs.forEach((wv, tabId) => {
    const isActive = tabId === activeTabId;
    wv.toggleTransparent(!isActive);
    wv.togglePassthrough(!isActive);
    if (isActive) wv.syncDimensions(true);
  });
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState("");
  // mountedIds tracks which webviews to keep in DOM — we add immediately on
  // tabState arrival but only remove after a 300ms delay to stagger WKWebView teardown
  const [mountedIds, setMountedIds] = useState<Set<string>>(new Set());

  // Receive authoritative state from Bun
  useEffect(() => {
    _setTabState = (newTabs, newActiveId) => {
      setTabs(newTabs);
      setActiveTabId(newActiveId);
      setMountedIds((prev) => {
        const incoming = new Set(newTabs.map((t) => t.id));
        // Mount new tabs immediately
        const toAdd = [...incoming].filter((id) => !prev.has(id));
        if (toAdd.length === 0) return prev;
        return new Set([...prev, ...toAdd]);
      });
      // Schedule unmount of tabs no longer in Bun's list
      setTabs((latestTabs) => {
        const incoming = new Set(newTabs.map((t) => t.id));
        const toRemove = [...mountedIds].filter((id) => !incoming.has(id));
        if (toRemove.length > 0) {
          setTimeout(() => {
            toRemove.forEach((id) => webviewRefs.delete(id));
            setMountedIds((prev) => {
              const next = new Set(prev);
              toRemove.forEach((id) => next.delete(id));
              return next;
            });
          }, 300);
        }
        return latestTabs;
      });
    };
    return () => { _setTabState = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync webview visibility whenever active tab changes
  useEffect(() => {
    if (activeTabId) syncVisibility(activeTabId);
  }, [activeTabId]);

  // Keyboard shortcuts — forward directly to Bun as tabActions
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === "t" && !e.shiftKey) { e.preventDefault(); sendAction({ type: "add" }); }
      else if (e.key === "w")           { e.preventDefault(); sendAction({ type: "close", id: activeTabId }); }
      else if (e.shiftKey && e.key === "T") { e.preventDefault(); sendAction({ type: "reopen" }); }
      else if (e.shiftKey && e.key === "]") { e.preventDefault(); sendAction({ type: "next" }); }
      else if (e.shiftKey && e.key === "[") { e.preventDefault(); sendAction({ type: "prev" }); }
      else if (e.key >= "1" && e.key <= "9") {
        e.preventDefault();
        sendAction({ type: "byIndex", index: Number(e.key) - 1 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTabId]);

  const handleCloseClick = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sendAction({ type: "close", id });
  }, []);

  const handleMiddleClick = useCallback((e: React.MouseEvent, id: string) => {
    if (e.button === 1) { e.preventDefault(); sendAction({ type: "close", id }); }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Tab bar */}
      <div className="drag-region h-10 shrink-0 flex items-center bg-[#1e1e1e] border-b border-white/[0.06]">
        <div className="shrink-0 w-[76px]" />
        <div className="no-drag flex items-center min-w-0 flex-1 overflow-x-auto px-1.5">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <button
                key={tab.id}
                onClick={() => sendAction({ type: "activate", id: tab.id })}
                onMouseDown={(e) => handleMiddleClick(e, tab.id)}
                className={`group relative flex items-center gap-2 h-10 px-3.5 text-[12px] font-medium shrink-0 transition-colors duration-150 ${
                  isActive ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-white/70" />
                )}
                <Layers className={`h-3 w-3 shrink-0 ${isActive ? "text-neutral-400" : "text-neutral-600"}`} />
                <span className="truncate max-w-[140px]">{tab.label}</span>
                <button
                  type="button"
                  aria-label="Close tab"
                  onClick={(e) => handleCloseClick(e, tab.id)}
                  className={`ml-0.5 p-0.5 rounded-sm transition-all hover:bg-white/10 ${
                    isActive ? "opacity-40 hover:opacity-100" : "opacity-0 group-hover:opacity-40 hover:!opacity-100"
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </button>
            );
          })}
        </div>
        <button
          onClick={() => sendAction({ type: "add" })}
          className="no-drag shrink-0 p-1.5 mx-1.5 rounded-md text-neutral-600 hover:text-neutral-400 hover:bg-white/[0.06] transition-all active:scale-[0.97]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Webviews — only mounted IDs are rendered */}
      <div className="flex-1 min-h-0 relative">
        {tabs.filter((tab) => mountedIds.has(tab.id)).map((tab) => (
          <electrobun-webview
            key={tab.id}
            src={getTabViewUrl(tab.id)}
            transparent={tab.id !== activeTabId ? "" : undefined}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            ref={(el: WebviewTagElement | null) => {
              if (el) {
                webviewRefs.set(tab.id, el);
                if (tab.id !== activeTabId) {
                  el.toggleTransparent(true);
                  el.togglePassthrough(true);
                }
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
