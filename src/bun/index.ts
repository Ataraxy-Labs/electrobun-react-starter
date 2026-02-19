import { BrowserWindow, BrowserView, Utils, Updater, ApplicationMenu } from "electrobun/bun";
import type { Tab, TabAction } from "../stubs/types";

const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function getViewUrl(): Promise<string> {
  const channel = await Updater.localInfo.channel();
  if (channel === "dev") {
    const viewUrl = `${DEV_SERVER_URL}/mainview/index.html`;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(viewUrl, { method: "HEAD" });
        if (res.ok) {
          console.log(`HMR enabled: Vite dev server at ${viewUrl}`);
          return viewUrl;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return "views://mainview/index.html";
}

function getTabViewUrl(tabId: string): string {
  const base = DEV_SERVER_URL;
  return `${base}/tabview/index.html?tabId=${encodeURIComponent(tabId)}`;
}

// ── Tab manager (runs entirely in Bun) ────────────────────────────────────────

const CLOSE_STACK_MAX = 25;
const MUTATION_THROTTLE_MS = 150;
const UNMOUNT_DELAY_MS = 300;

let nextId = 1;
function makeTab(): Tab {
  return { id: `tab-${nextId++}`, label: "New Tab" };
}

let tabs: Tab[] = [makeTab()];
let activeTabId: string = tabs[0].id;
const closedStack: Tab[] = [];
let lastMutationAt = 0;

function throttle(): boolean {
  const now = Date.now();
  if (now - lastMutationAt < MUTATION_THROTTLE_MS) return false;
  lastMutationAt = now;
  return true;
}

function pushState() {
  shellRpc.send("tabState", { tabs: [...tabs], activeTabId });
}

function tabAdd() {
  if (!throttle()) return;
  const tab = makeTab();
  tabs = [...tabs, tab];
  activeTabId = tab.id;
  pushState();
  // Open the webview for this tab
  console.log(`[Bun] opening tabview for ${tab.id} at ${getTabViewUrl(tab.id)}`);
}

function tabClose(id: string) {
  if (!throttle()) return;
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx === -1) return;

  const closed = tabs[idx];
  const alreadyInStack = closedStack.some((t) => t.id === id);
  if (!alreadyInStack) {
    closedStack.push(closed);
    if (closedStack.length > CLOSE_STACK_MAX) closedStack.shift();
  }

  const next = tabs.filter((t) => t.id !== id);
  if (next.length === 0) {
    Utils.quit();
    return;
  }

  if (activeTabId === id) {
    activeTabId = next[Math.min(idx, next.length - 1)].id;
  }
  tabs = next;

  // Defer pushing state so shell can animate the close before unmounting webview
  setTimeout(() => pushState(), UNMOUNT_DELAY_MS);
  // Push immediately for tab bar update (active switch, tab removal)
  pushState();
}

function tabReopen() {
  if (!throttle()) return;
  const tab = closedStack.pop();
  if (!tab) return;
  const revived: Tab = { ...tab, id: `tab-${nextId++}` };
  tabs = [...tabs, revived];
  activeTabId = revived.id;
  pushState();
}

function tabActivate(id: string) {
  if (!tabs.some((t) => t.id === id)) return;
  activeTabId = id;
  pushState();
}

function tabPrev() {
  const cur = tabs.findIndex((t) => t.id === activeTabId);
  activeTabId = tabs[(cur - 1 + tabs.length) % tabs.length].id;
  pushState();
}

function tabNext() {
  const cur = tabs.findIndex((t) => t.id === activeTabId);
  activeTabId = tabs[(cur + 1) % tabs.length].id;
  pushState();
}

function tabByIndex(index: number) {
  const idx = index === 8 ? tabs.length - 1 : Math.min(index, tabs.length - 1);
  activeTabId = tabs[idx].id;
  pushState();
}

function handleTabAction(action: TabAction) {
  switch (action.type) {
    case "add":      tabAdd(); break;
    case "close":    tabClose(action.id); break;
    case "activate": tabActivate(action.id); break;
    case "reopen":   tabReopen(); break;
    case "prev":     tabPrev(); break;
    case "next":     tabNext(); break;
    case "byIndex":  tabByIndex(action.index); break;
  }
}

// ── Application menu ──────────────────────────────────────────────────────────

const menuConfig = [
  {
    label: "ElectrobunDemo",
    submenu: [{ role: "quit", accelerator: "cmd+q" }],
  },
  {
    label: "File",
    submenu: [
      { type: "normal", label: "New Tab",          action: "tab:new",    accelerator: "cmd+t" },
      { type: "normal", label: "Close Tab",         action: "tab:close",  accelerator: "cmd+w" },
      { type: "normal", label: "Reopen Closed Tab", action: "tab:reopen", accelerator: "cmd+shift+t" },
    ],
  },
  {
    label: "Edit",
    submenu: [
      { role: "undo" },
      { role: "redo" },
      { type: "separator" },
      { role: "cut" },
      { role: "copy" },
      { role: "paste" },
      { role: "selectAll" },
    ],
  },
  {
    label: "View",
    submenu: [
      { type: "normal", label: "Previous Tab", action: "tab:prev", accelerator: "cmd+shift+[" },
      { type: "normal", label: "Next Tab",      action: "tab:next", accelerator: "cmd+shift+]" },
      ...[1,2,3,4,5,6,7,8,9].map((n) => ({
        type: "normal", label: `Tab ${n}`, action: `tab:${n}`, accelerator: `cmd+${n}`,
      })),
    ],
  },
];

ApplicationMenu.setApplicationMenu(menuConfig as any);

// ── Shell RPC ─────────────────────────────────────────────────────────────────

const shellRpc = BrowserView.defineRPC<any>({
  maxRequestTime: 60000,
  handlers: {
    requests: {},
    messages: {
      tabAction: (action: TabAction) => {
        handleTabAction(action);
      },
    },
  },
});

ApplicationMenu.on("application-menu-clicked", (e) => {
  const { action } = e.data;
  if (action === "tab:new")         handleTabAction({ type: "add" });
  else if (action === "tab:close")  handleTabAction({ type: "close", id: activeTabId });
  else if (action === "tab:reopen") handleTabAction({ type: "reopen" });
  else if (action === "tab:prev")   handleTabAction({ type: "prev" });
  else if (action === "tab:next")   handleTabAction({ type: "next" });
  else if (action.startsWith("tab:") && !isNaN(Number(action.slice(4)))) {
    handleTabAction({ type: "byIndex", index: Number(action.slice(4)) - 1 });
  }
});

// ── Tab RPC (OOPIF tabs) ──────────────────────────────────────────────────────

const tabViewsByTabId = new Map<string, ReturnType<typeof BrowserView.getById>>();

const rpc = BrowserView.defineRPC<any>({
  maxRequestTime: 60000,
  handlers: {
    requests: {
      registerTab: async ({ tabId, webviewId }: { tabId: string; webviewId: number }) => {
        const view = BrowserView.getById(webviewId);
        if (view) {
          tabViewsByTabId.set(tabId, view);
          console.log(`[Bun] registered tab ${tabId} → webview ${webviewId}`);
        }
      },
      unregisterTab: async ({ tabId }: { tabId: string }) => {
        tabViewsByTabId.delete(tabId);
        console.log(`[Bun] unregistered tab ${tabId}`);
      },
      ping: async ({ message }: { message: string }) => {
        return { pong: `You said: "${message}" — hello from Bun 🐰` };
      },
      get_system_info: async () => ({
        platform: process.platform,
        arch: process.arch,
        bunVersion: Bun.version,
        cwd: process.cwd(),
        pid: process.pid,
      }),
      open_file_dialog: async () => {
        const files = await Utils.openFileDialog({
          canChooseFiles: true,
          canChooseDirectory: false,
          allowsMultipleSelection: true,
        });
        return { files };
      },
      open_external: async ({ url }: { url: string }) => {
        await Utils.openExternal(url);
      },
    },
    messages: {} as any,
  },
});

// ── Window + webview wiring ───────────────────────────────────────────────────

const url = await getViewUrl();

const mainWindow = new BrowserWindow({
  title: "ElectrobunDemo",
  url,
  frame: { width: 1100, height: 750, x: 100, y: 100 },
  titleBarStyle: "hiddenInset",
  transparent: false,
  rpc: shellRpc,
});

mainWindow.on("close", () => Utils.quit());

(BrowserView as any).onTagCreated((view: any) => {
  rpc.setTransport(view.createTransport());
  console.log(`[Bun] tab rpc attached to view ${view.id}`);
});

// Push initial state to shell once it's loaded
setTimeout(() => pushState(), 1000);

console.log("✅ ElectrobunDemo started");
