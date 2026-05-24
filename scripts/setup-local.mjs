#!/usr/bin/env node
import { copyFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB = join(ROOT, "apps/e_imar_web");

function ensureEnv(source, target, label) {
  if (existsSync(target)) {
    console.log(`[ok] ${label} already exists`);
    return;
  }
  if (!existsSync(source)) {
    console.warn(`[warn] ${label} template missing: ${source}`);
    return;
  }
  copyFileSync(source, target);
  console.log(`[ok] Created ${label}`);
}

function run(cmd, args, cwd = ROOT) {
  const result = spawnSync(cmd, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("==> E-İmar local setup");
console.log(`Root: ${ROOT}`);

ensureEnv(join(ROOT, ".env.example"), join(ROOT, ".env"), ".env");
ensureEnv(join(WEB, ".env.example"), join(WEB, ".env"), "apps/e_imar_web/.env");

console.log("==> Installing root dependencies");
run("npm", ["install"]);

console.log("==> Installing web dependencies");
run("npm", ["install"], WEB);

console.log("");
console.log("Setup complete.");
console.log("Start the app:");
console.log("  npm run dev:all");
console.log("  or on Windows: start.cmd");
