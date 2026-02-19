// RPC bridge — calls Bun via Electrobun RPC, falls back to mock data in browser dev mode.

export interface SystemInfo {
  platform: string;
  arch: string;
  bunVersion: string;
  cwd: string;
  pid: number;
}

function getRpc() {
  return (window as any).__demoRpc ?? null;
}

export async function ping(message: string): Promise<{ pong: string }> {
  const rpc = getRpc();
  if (rpc) return rpc.request.ping({ message });
  await new Promise((r) => setTimeout(r, 300));
  return { pong: `[mock] You said: "${message}" — hello from mock Bun 🐰` };
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const rpc = getRpc();
  if (rpc) return rpc.request.get_system_info({});
  await new Promise((r) => setTimeout(r, 200));
  return {
    platform: "browser (mock)",
    arch: "wasm",
    bunVersion: "n/a",
    cwd: "/mock/cwd",
    pid: 0,
  };
}

export async function openFileDialog(): Promise<{ files: string[] }> {
  const rpc = getRpc();
  if (rpc) return rpc.request.open_file_dialog({});
  await new Promise((r) => setTimeout(r, 200));
  return { files: ["/mock/file1.txt", "/mock/file2.ts"] };
}

export async function openExternal(url: string): Promise<void> {
  const rpc = getRpc();
  if (rpc) return rpc.request.open_external({ url });
  window.open(url, "_blank");
}
