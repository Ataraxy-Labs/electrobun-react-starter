#!/usr/bin/env bun
// Bun backend dev script: builds electrobun bundle, starts the app, watches
// src/bun/ for changes and rebuilds + restarts cleanly on each save.
//
// Run via: bun run dev:bun
// Run `bun run dev:vite` in a separate terminal for frontend HMR.

import { spawn, type Subprocess } from "bun";
import { watch } from "fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function build() {
  console.log("[bun] Building electrobun bundle...");
  const proc = spawn(["bunx", "electrobun", "build"], {
    stdio: ["pipe", "inherit", "inherit"],
    cwd: import.meta.dir + "/..",
  });
  await proc.exited;
  return proc.exitCode === 0;
}

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
  // Wait for OS to fully tear down the WKWebView and release the port
  await sleep(1200);
}

async function startApp() {
  if (restarting) {
    console.log("[bun] Restart already in progress, skipping.");
    return;
  }
  restarting = true;
  try {
    if (appProc) {
      console.log("[bun] Killing old launcher process...");
      killProc(appProc);
      appProc = null;
    }
    await killRunningApp();
    console.log("[bun] Starting app...");
    // Run detached so electrobun's tcsetpgrp can't steal terminal foreground —
    // keeps Ctrl+C working in our script.
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
  console.error("[bun] Initial build failed");
  process.exit(1);
}
await startApp();

// Watch src/bun/ only — frontend changes are handled by Vite HMR in the other terminal.
// rebuilding guard drops events that fire during our own build to prevent cascading restarts.
let debounce: Timer | null = null;
let rebuilding = false;
watch(import.meta.dir + "/../src/bun", { recursive: true }, (event, filename) => {
  if (!filename?.match(/\.(ts|js)$/)) return;
  if (rebuilding) return;
  console.log(`[bun] Changed: src/bun/${filename}`);
  if (debounce) clearTimeout(debounce);
  debounce = setTimeout(async () => {
    rebuilding = true;
    const ok = await build();
    rebuilding = false;
    if (ok) await startApp();
    else console.error("[bun] Rebuild failed, app not restarted");
  }, 600);
});

console.log("[bun] Watching src/bun/ for changes. Frontend HMR via `bun run dev:vite`.");

async function shutdown() {
  console.log("\n[bun] Shutting down...");
  if (appProc) killProc(appProc);
  await killRunningApp();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
