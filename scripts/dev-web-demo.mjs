#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";
const openBrowser = process.argv.includes("--open");
const WEB_URL = "http://localhost:3001";

await import("./ensure-demo-env.mjs");

console.log("==> E-İmar demo (web only, API gerekmez)");
console.log(`Web  → ${WEB_URL}`);
console.log("Mod  → demo (örnek parseller + yerel fixture)");
if (openBrowser) {
  console.log(`Browser will open at ${WEB_URL} once the web server is ready.`);
}
console.log("Press Ctrl+C to stop.");
console.log("");

const child = spawn(npmCmd, ["run", "web:dev"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
  env: {
    ...process.env,
    FORCE_COLOR: "1",
    NEXT_PUBLIC_EIMAR_DATA_MODE: "demo",
    NEXT_PUBLIC_EIMAR_ENABLE_DEMO_FALLBACK: "1"
  }
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => {
  if (!child.killed) {
    if (isWin) {
      spawn("taskkill", ["/pid", String(child.pid), "/f", "/t"], { stdio: "ignore", shell: true });
    } else {
      child.kill("SIGTERM");
    }
  }
});

if (openBrowser) {
  scheduleBrowserOpen();
}

function scheduleBrowserOpen() {
  const startedAt = Date.now();
  const maxWaitMs = 90_000;

  const tick = () => {
    fetch(WEB_URL, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          openInBrowser(WEB_URL);
          return;
        }
        retry();
      })
      .catch(() => retry());
  };

  function retry() {
    if (Date.now() - startedAt > maxWaitMs) {
      console.warn(`[browser] Timed out waiting for ${WEB_URL}; open it manually.`);
      return;
    }
    setTimeout(tick, 1500);
  }

  setTimeout(tick, 4000);
}

function openInBrowser(url) {
  console.log(`[browser] Opening ${url}`);
  if (isWin) {
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", shell: true });
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { stdio: "ignore" });
    return;
  }
  spawn("xdg-open", [url], { stdio: "ignore" });
}
