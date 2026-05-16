#!/usr/bin/env node
import { spawn } from "node:child_process";

const ROOT_DIR = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const WEB_DIR = `${ROOT_DIR}/apps/e_imar_web`;
const PORT = Number(process.env.WEB_SMOKE_PORT || 3100);
const HOST = process.env.WEB_SMOKE_HOST || "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const TIMEOUT_MS = Number(process.env.WEB_SMOKE_TIMEOUT_MS || 90_000);

const homeShellSnippets = [
  "Parsel ve imar sorgulama",
  "Parsel sorgulamak için",
  "Haritada bir noktaya dokun",
  "Katman",
];

let server;
let stopping = false;

function log(message) {
  console.log(`[web-smoke] ${message}`);
}

function fail(message) {
  console.error(`[web-smoke] ${message}`);
  process.exitCode = 1;
  cleanup();
}

function cleanup() {
  stopping = true;
  if (server && !server.killed) {
    server.kill("SIGTERM");
    setTimeout(() => {
      if (server && !server.killed) server.kill("SIGKILL");
    }, 5_000).unref();
  }
}

async function fetchWithTimeout(url, timeoutMs = 8_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = "server did not respond";

  while (Date.now() - startedAt < TIMEOUT_MS) {
    try {
      const response = await fetchWithTimeout(BASE_URL, 5_000);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(`Timed out waiting for ${BASE_URL}: ${lastError}`);
}

async function assertPage(pathname, snippets) {
  const response = await fetchWithTimeout(`${BASE_URL}${pathname}`, 10_000);
  if (!response.ok) {
    throw new Error(`${pathname} returned HTTP ${response.status}`);
  }

  const html = (await response.text()).replaceAll("<!-- -->", "");
  const missing = snippets.filter((snippet) => !html.includes(snippet));
  if (missing.length > 0) {
    throw new Error(`${pathname} missing expected shell text: ${missing.join(", ")}`);
  }
}

process.on("exit", cleanup);
process.on("SIGINT", () => fail("interrupted"));
process.on("SIGTERM", () => fail("terminated"));

try {
  log(`starting apps/e_imar_web on ${BASE_URL}`);
  server = spawn("./node_modules/.bin/next", ["dev", "-p", String(PORT), "-H", HOST], {
    cwd: WEB_DIR,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      NEXT_PUBLIC_EIMAR_API_BASE_URL: process.env.NEXT_PUBLIC_EIMAR_API_BASE_URL || "http://127.0.0.1:9",
      NEXT_PUBLIC_EIMAR_DATA_MODE: process.env.NEXT_PUBLIC_EIMAR_DATA_MODE || "fixture",
      NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL: process.env.NEXT_PUBLIC_EIMAR_VECTOR_TILE_URL || "",
      NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  server.on("exit", (code, signal) => {
    if (stopping) return;
    if (process.exitCode === undefined && code !== null && code !== 0) {
      process.exitCode = code;
      console.error(`[web-smoke] web app exited early with code ${code}`);
    } else if (signal && process.exitCode === undefined) {
      process.exitCode = 1;
      console.error(`[web-smoke] web app exited early from ${signal}`);
    }
  });

  await waitForServer();
  await assertPage("/", homeShellSnippets);
  log("home map-first shell rendered without provider credentials");
  cleanup();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
