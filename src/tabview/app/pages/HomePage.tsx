import { Zap, Radio, Cpu } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function HomePage() {
  return (
    <div className="p-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">ElectrobunDemo</h1>
        <p className="text-white/50 text-base leading-relaxed">
          A minimal Electrobun + React 19 + TanStack Router demo app.
          Pick a demo from the sidebar to explore the Bun ↔ WebView RPC bridge.
        </p>
      </div>

      <div className="grid gap-4">
        <DemoCard
          to="/ping"
          icon={<Radio size={20} className="text-violet-400" />}
          title="Ping Demo"
          description="Send a message to the Bun backend and receive a response. Tests the round-trip RPC."
          color="violet"
        />
        <DemoCard
          to="/system-info"
          icon={<Cpu size={20} className="text-sky-400" />}
          title="System Info"
          description="Ask Bun for runtime details: platform, arch, Bun version, cwd, and PID."
          color="sky"
        />
      </div>

      <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={15} className="text-yellow-400" />
          <span className="text-sm font-semibold text-white/70">Stack</span>
        </div>
        <ul className="text-sm text-white/50 space-y-1 list-disc list-inside">
          <li>Electrobun — Bun + WKWebView desktop runtime</li>
          <li>React 19 + React Compiler</li>
          <li>TanStack Router (code-based routes)</li>
          <li>TanStack Query</li>
          <li>Tailwind CSS v4</li>
        </ul>
      </div>
    </div>
  );
}

function DemoCard({
  to,
  icon,
  title,
  description,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "violet" | "sky";
}) {
  const border =
    color === "violet"
      ? "hover:border-violet-500/40"
      : "hover:border-sky-500/40";

  return (
    <Link
      to={to}
      className={`block rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:bg-white/[0.06] ${border}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="font-semibold text-white">{title}</span>
      </div>
      <p className="text-sm text-white/50">{description}</p>
    </Link>
  );
}
