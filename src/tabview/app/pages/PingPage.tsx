import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Radio, Send } from "lucide-react";
import { ping } from "../rpc";

export function PingPage() {
  const [input, setInput] = useState("Hello, Bun!");

  const mutation = useMutation({
    mutationFn: () => ping(input),
  });

  return (
    <div className="p-10 max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <Radio size={20} className="text-violet-400" />
        <h1 className="text-2xl font-bold text-white">Ping Demo</h1>
      </div>
      <p className="text-white/50 text-sm mb-8">
        Send a message to the Bun backend over RPC and see the response.
      </p>

      <div className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && mutation.mutate()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-violet-500/60 transition-colors"
          />
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !input.trim()}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={14} />
            Send
          </button>
        </div>

        {mutation.isPending && (
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-white/40 animate-pulse">
            Waiting for Bun...
          </div>
        )}

        {mutation.isSuccess && (
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
            <p className="text-xs text-violet-400 font-semibold mb-1 uppercase tracking-wider">
              Response
            </p>
            <p className="text-sm text-white">{mutation.data.pong}</p>
          </div>
        )}

        {mutation.isError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            Error: {String(mutation.error)}
          </div>
        )}
      </div>
    </div>
  );
}
