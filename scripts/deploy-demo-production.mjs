#!/usr/bin/env node
/**
 * Production build + start in demo mode, optional Cloudflare quick tunnel.
 * Usage: node scripts/deploy-demo-production.mjs [--tunnel]
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "apps/e_imar_web");
const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || "0.0.0.0";
const withTunnel = process.argv.includes("--tunnel");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

await import("./ensure-demo-env.mjs");

const env = {
  ...process.env,
  NODE_ENV: "production",
  PORT: String(PORT),
  HOST,
  NEXT_PUBLIC_EIMAR_DATA_MODE: "demo",
  NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: "1",
  NEXT_PUBLIC_EIMAR_SITE_URL: process.env.NEXT_PUBLIC_EIMAR_SITE_URL || `http://localhost:${PORT}`
};

function run(cmd, args, cwd = ROOT) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", shell: isWin, env });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

console.log("==> Building production web (demo mode)");
await run(npmCmd, ["run", "web:build"], ROOT);

console.log(`==> Starting production server on http://${HOST}:${PORT}`);
const server = spawn(npmCmd, ["run", "web:preview", "--", "-p", String(PORT), "-H", HOST], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
  env
});

let tunnel;
if (withTunnel) {
  const startedAt = Date.now();
  const wait = async () => {
    while (Date.now() - startedAt < 60_000) {
      try {
        const res = await fetch(`http://127.0.0.1:${PORT}/healthz`);
        if (res.ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }
    throw new Error("Server did not become ready for tunnel");
  };
  await wait();
  console.log("==> Opening Cloudflare quick tunnel...");
  tunnel = spawn("cloudflared", ["tunnel", "--url", `http://127.0.0.1:${PORT}`], {
    stdio: ["ignore", "pipe", "pipe"]
  });
  tunnel.stdout.on("data", (chunk) => process.stdout.write(chunk));
  tunnel.stderr.on("data", (chunk) => {
    const text = chunk.toString();
    process.stderr.write(chunk);
    const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) console.log(`\n[deploy] Public URL: ${match[0]}\n`);
  });
}

function shutdown() {
  if (tunnel && !tunnel.killed) tunnel.kill("SIGTERM");
  if (server && !server.killed) server.kill("SIGTERM");
  setTimeout(() => process.exit(0), 300);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
server.on("exit", (code) => process.exit(code ?? 0));
