import {
  createRouter,
  createHashHistory,
  createRootRoute,
  createRoute,
  Outlet,
  Link,
} from "@tanstack/react-router";
import { Home, Radio, Cpu, ExternalLink } from "lucide-react";
import { HomePage } from "./pages/HomePage";
import { PingPage } from "./pages/PingPage";
import { SystemInfoPage } from "./pages/SystemInfoPage";

function RootLayout() {
  return (
    <div className="flex h-screen">
      <nav className="w-48 shrink-0 border-r border-white/10 bg-white/[0.03] flex flex-col gap-1 p-3">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-2 mt-1">
          Demo
        </p>
        <NavLink to="/" icon={<Home size={14} />} label="Home" exact />
        <NavLink to="/ping" icon={<Radio size={14} />} label="Ping" />
        <NavLink to="/system-info" icon={<Cpu size={14} />} label="System Info" />
        <div className="mt-auto">
          <button
            onClick={() =>
              import("./rpc").then(({ openExternal }) =>
                openExternal("https://github.com/Ataraxy-Labs/electrobun-react-starter")
              )
            }
            className="flex items-center gap-2 px-3 py-2 w-full text-xs text-white/30 hover:text-white/60 transition-colors rounded-lg hover:bg-white/5"
          >
            <ExternalLink size={12} />
            GitHub
          </button>
        </div>
      </nav>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}

function NavLink({
  to,
  icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  exact?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      activeProps={{ className: "!text-white !bg-white/10" }}
      activeOptions={{ exact }}
    >
      {icon}
      {label}
    </Link>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const pingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ping",
  component: PingPage,
});

const systemInfoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/system-info",
  component: SystemInfoPage,
});

const routeTree = rootRoute.addChildren([indexRoute, pingRoute, systemInfoRoute]);

export const router = createRouter({ routeTree, history: createHashHistory() });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
