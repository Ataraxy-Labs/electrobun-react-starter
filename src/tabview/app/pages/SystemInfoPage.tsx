import { useQuery } from "@tanstack/react-query";
import { Cpu, RefreshCw } from "lucide-react";
import { getSystemInfo, type SystemInfo } from "../rpc";

export function SystemInfoPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["system-info"],
    queryFn: getSystemInfo,
  });

  return (
    <div className="p-10 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Cpu size={20} className="text-sky-400" />
        <h1 className="text-2xl font-bold text-white">System Info</h1>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white hover:border-white/20 disabled:opacity-40 transition-colors"
        >
          <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>
      <p className="text-white/50 text-sm mb-8">
        Runtime details reported by the Bun backend process.
      </p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          Error: {String(error)}
        </div>
      )}

      {data && <InfoTable info={data} />}
    </div>
  );
}

function InfoTable({ info }: { info: SystemInfo }) {
  const rows: { label: string; value: string | number }[] = [
    { label: "Platform", value: info.platform },
    { label: "Architecture", value: info.arch },
    { label: "Bun Version", value: info.bunVersion },
    { label: "Working Directory", value: info.cwd },
    { label: "Process ID", value: info.pid },
  ];

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-baseline gap-4 px-5 py-3.5 ${
            i % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
          }`}
        >
          <span className="w-40 shrink-0 text-xs font-medium text-white/40 uppercase tracking-wider">
            {row.label}
          </span>
          <span className="text-sm text-white font-mono break-all">
            {String(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
