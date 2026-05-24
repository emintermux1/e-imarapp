#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const children = [];

function start(label, args, cwd = ROOT) {
  const child = spawn(npmCmd, args, {
    cwd,
    stdio: "inherit",
    shell: isWin,
    env: {
      ...process.env,
      FORCE_COLOR: "1"
    }
  });
  child.on("exit", (code, signal) => {
    if (signal) {
      console.log(`[${label}] stopped (${signal})`);
    } else if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
  console.log(`[${label}] started (pid ${child.pid})`);
  return child;
}

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) {
      if (isWin) {
        spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], { stdio: "ignore", shell: true });
      } else {
        child.kill("SIGTERM");
      }
    }
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("==> E-İmar dev stack");
console.log("API  → http://localhost:3000");
console.log("Web  → http://localhost:3001");
console.log("Docs → http://localhost:3000/docs");
console.log("Press Ctrl+C to stop both servers.");
console.log("");

start("api", ["run", "start:dev"]);
setTimeout(() => start("web", ["run", "web:dev"]), 1500);
