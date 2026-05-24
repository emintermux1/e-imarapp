#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WEB_ENV = join(ROOT, "apps/e_imar_web/.env");
const WEB_ENV_EXAMPLE = join(ROOT, "apps/e_imar_web/.env.example");

const DEMO_KEYS = {
  NEXT_PUBLIC_EIMAR_DATA_MODE: "demo",
  NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: "1",
  NEXT_PUBLIC_EIMAR_SITE_URL: "http://localhost:3001"
};

function upsertEnvLines(content) {
  const lines = content.split(/\r?\n/);
  const seen = new Set();

  const next = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return line;
    const key = match[1];
    if (!(key in DEMO_KEYS)) return line;
    seen.add(key);
    return `${key}=${DEMO_KEYS[key]}`;
  });

  for (const [key, value] of Object.entries(DEMO_KEYS)) {
    if (!seen.has(key)) next.push(`${key}=${value}`);
  }

  return `${next.filter((line, index, arr) => !(index === arr.length - 1 && line === "")).join("\n")}\n`;
}

if (!existsSync(WEB_ENV)) {
  if (existsSync(WEB_ENV_EXAMPLE)) {
    copyFileSync(WEB_ENV_EXAMPLE, WEB_ENV);
    console.log("[demo-env] Created apps/e_imar_web/.env from example");
  } else {
    writeFileSync(WEB_ENV, "", "utf8");
    console.log("[demo-env] Created empty apps/e_imar_web/.env");
  }
}

const current = readFileSync(WEB_ENV, "utf8");
const updated = upsertEnvLines(current);
writeFileSync(WEB_ENV, updated, "utf8");
console.log("[demo-env] Demo mode enabled in apps/e_imar_web/.env");
console.log("[demo-env] NEXT_PUBLIC_EIMAR_DATA_MODE=demo (API gerekmez)");
