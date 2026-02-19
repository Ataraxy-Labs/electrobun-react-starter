# ⚡ electrobun-react-starter

A batteries-included starter template for building **native desktop apps** with [Electrobun](https://electrobun.dev), React 19, TanStack Router, and Tailwind CSS v4.

> **Electrobun** = Bun + WKWebView — blazing fast, zero-Electron desktop apps for macOS (Linux & Windows coming soon).

## What's inside

| Layer | Tech | Role |
|-------|------|------|
| **Runtime** | [Electrobun](https://electrobun.dev) | Native window, webview, menus, file dialogs |
| **Backend** | [Bun](https://bun.sh) | Backend process with typed RPC handlers |
| **Frontend** | [React 19](https://react.dev) + [React Compiler](https://react.dev/learn/react-compiler) | UI with automatic memoization |
| **Routing** | [TanStack Router](https://tanstack.com/router) | Type-safe, code-based routing |
| **Data** | [TanStack Query](https://tanstack.com/query) | Async state management for RPC calls |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) | Utility-first CSS |
| **Build** | [Vite 7](https://vite.dev) | HMR dev server + production bundling |

## Architecture

```
┌─────────────────────────────────────────────────┐
│  BrowserWindow (native frame, titleBarStyle)    │
│  ┌───────────────────────────────────────────┐  │
│  │  mainview (shell)                         │  │
│  │  • Tab bar UI                             │  │
│  │  • Keyboard shortcuts                     │  │
│  │  • Manages <electrobun-webview> tags       │  │
│  │  ┌─────────────────────────────────────┐  │  │
│  │  │  tabview (per-tab OOPIF webview)    │  │  │
│  │  │  • TanStack Router + Query          │  │  │
│  │  │  • Your app pages live here         │  │  │
│  │  └─────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ▲                           ▲
         │  Shell RPC                │  Tab RPC
         ▼                           ▼
┌─────────────────────────────────────────────────┐
│  Bun process (src/bun/index.ts)                 │
│  • Tab state management                         │
│  • Application menu                             │
│  • RPC handlers (ping, system info, dialogs)    │
└─────────────────────────────────────────────────┘
```

**Two RPC channels** keep things clean:

- **Shell RPC** — Bun ↔ mainview: pushes tab state, receives tab actions
- **Tab RPC** — Bun ↔ each tab webview: handles app-level requests (ping, system info, file dialogs)

## Quick start

### Prerequisites

- **macOS** (Electrobun currently supports macOS, with Linux & Windows on the roadmap)
- [Bun](https://bun.sh) ≥ 1.1

### Setup

```bash
# Clone the template
gh repo create my-app --template Ataraxy-Labs/electrobun-react-starter --clone
cd my-app

# Install dependencies
bun install

# Start developing (Vite HMR + Bun watcher in one process)
bun run dev
```

Or use the two-terminal workflow for more control:

```bash
# Terminal 1: Vite dev server with HMR
bun run dev:vite

# Terminal 2: Bun backend with auto-rebuild on save
bun run dev:bun
```

### Build for production

```bash
bun run build
```

## Project structure

```
src/
├── bun/
│   └── index.ts          # Bun backend — tab manager, menus, RPC handlers
├── mainview/
│   ├── App.tsx            # Shell — tab bar + webview container
│   ├── main.tsx           # Shell entrypoint
│   ├── index.html
│   └── index.css
├── tabview/
│   ├── tabview-main.tsx   # Tab entrypoint — sets up RPC, Query, Router
│   ├── index.html
│   └── app/
│       ├── router.tsx     # TanStack Router config
│       ├── rpc.ts         # RPC bridge with browser-mode mock fallbacks
│       ├── index.css
│       └── pages/
│           ├── HomePage.tsx
│           ├── PingPage.tsx
│           └── SystemInfoPage.tsx
└── stubs/
    └── types.ts           # Shared RPC type contracts (Tab, ShellRPC, TabRPC)
```

## Demo pages

The starter ships with three demo pages to show how things work:

| Page | What it shows |
|------|---------------|
| **Home** | Landing page with links to demos and a stack overview |
| **Ping** | Round-trip RPC — send a message to Bun, get a response back |
| **System Info** | TanStack Query fetching system details from Bun (platform, arch, PID, etc.) |

## Adding a new page

1. Create `src/tabview/app/pages/MyPage.tsx`
2. Add an RPC handler in `src/bun/index.ts` (if it needs backend data)
3. Add the RPC call in `src/tabview/app/rpc.ts`
4. Register the route in `src/tabview/app/router.tsx`

## RPC mock fallbacks

The RPC bridge (`src/tabview/app/rpc.ts`) includes mock fallbacks so you can develop the frontend in a regular browser without running Electrobun — just open `http://localhost:5173/tabview/index.html` directly.

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start everything (Vite + Bun watcher) in one process |
| `bun run dev:vite` | Start only the Vite dev server |
| `bun run dev:bun` | Start only the Bun backend with file watching |
| `bun run build` | Production build (Vite bundle + Electrobun package) |

## License

MIT

---

Built with 🔩 by [Ataraxy Labs](https://github.com/Ataraxy-Labs)
