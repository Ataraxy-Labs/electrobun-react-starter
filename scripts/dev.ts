#!/usr/bin/env bun
// Combined dev script: starts Vite + watches src/bun/ for changes.
// For the two-terminal workflow use `dev:vite` + `dev:bun` instead.

import { spawn, type Subprocess } from "bun";
import { watch } from "fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function build() {
  console.log("[dev] Building electrobun bundle...");
  const proc = spawn(["bunx", "electrobun", "build"], {
    stdio: ["pipe", "inherit", "inherit"],
    cwd: import.meta.dir + "/..",
  });
  await proc.exited;
  return proc.exitCode === 0;
}

// Start Vite dev server (HMR for frontend)
const viteProc = spawn(["bun", "node_modules/.bin/vite", "--port", "5173"], {
  stdio: ["pipe", "inherit", "inherit"],
  cwd: import.meta.dir + "/..",
});

let appProc: Subprocess | null = null;
let restarting = false;

function killProc(proc: Subprocess) {
  try {
    process.kill(-proc.pid!, "SIGTERM");
  } catch {
    proc.kill();
  }
}

async function killRunningApp() {
  const appPath = import.meta.dir + "/../build/dev-macos-arm64/ElectrobunDemo-dev.app";
  const patterns = [appPath, "electrobun dev"];
  await Promise.all(
    patterns.map(async (pat) => {
      try {
        const pkill = spawn(["pkill", "-9", "-f", pat], { stdio: ["pipe", "pipe", "pipe"] });
        await pkill.exited;
      } catch {
        // No match — fine
      }
    })
  );
  await sleep(1200);
}

async function startApp() {
  if (restarting) {
    console.log("[dev] Restart already in progress, skipping.");
    return;
  }
  restarting = true;
  try {
    if (appProc) {
      console.log("[dev] Killing old launcher process...");
      killProc(appProc);
      appProc = null;
    }
    await killRunningApp();
    console.log("[dev] Starting app...");
    appProc = spawn(["bunx", "electrobun", "dev"], {
      stdio: ["pipe", "inherit", "inherit"],
      cwd: import.meta.dir + "/..",
      detached: true,
    });
  } finally {
    restarting = false;
  }
}

// Initial build + start
const ok = await build();
if (!ok) {
  console.error("[dev] Initial build failed");
  process.exit(1);
}
await startApp();

// Watch src/bun/ for changes
let debounce: Timer | null = null;
let rebuilding = false;
watch(import.meta.dir + "/../src/bun", { recursive: true }, (event, filename) => {
  if (!filename?.match(/\.(ts|js)$/)) return;
  if (rebuilding) return;
  console.log(`[dev] Changed: src/bun/${filename}`);
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(async () => {
    rebuilding = true;
    const ok = await build();
    rebuilding = false;
    if (ok) await startApp();
    else console.error("[dev] Rebuild failed, app not restarted");
  }, 600);
});

console.log("[dev] Watching src/bun/ for changes...");

async function shutdown() {
  console.log("\n[dev] Shutting down...");
  if (appProc) killProc(appProc);
  killProc(viteProc);
  await killRunningApp();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
