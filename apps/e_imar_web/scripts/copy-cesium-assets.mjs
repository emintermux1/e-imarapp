// Copies Cesium runtime assets from node_modules/cesium/Build/Cesium into
// public/cesium/ so window.CESIUM_BASE_URL = "/cesium/" can serve them.
//
// We deliberately avoid copy-webpack-plugin because the cesium asset tree is
// large (~70 MB) and we only want this to run once after install / before
// dev/build. Cesium is also lazy-imported on the client, so the assets must
// be reachable as static files.

import { mkdir, cp, stat, readdir, rm, readFile, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const SRC = path.join(root, "node_modules", "cesium", "Build", "Cesium");
const DEST = path.join(root, "public", "cesium");

const REQUIRED = ["Workers", "Assets", "Widgets", "ThirdParty"];

async function main() {
  if (!existsSync(SRC)) {
    console.warn(
      `[cesium] node_modules/cesium not found at ${SRC} — skipping asset copy. ` +
        `Install dependencies first.`
    );
    return;
  }

  // Stamp file lets us skip when already up-to-date with the installed version.
  // NOTE: read package.json synchronously rather than dynamic-importing the
  // absolute path. On Windows, `await import("C:\\...\\package.json")` throws
  // ERR_UNSUPPORTED_ESM_URL_SCHEME because Node's ESM loader treats `C:` as a
  // URL scheme; using readFileSync sidesteps the platform difference entirely.
  const pkgPath = path.join(root, "node_modules", "cesium", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const version = pkg.version;
  const stampPath = path.join(DEST, ".cesium-version");

  if (existsSync(stampPath)) {
    try {
      const stampVer = (await readFile(stampPath, "utf-8")).trim();
      if (stampVer === version) {
        console.log(`[cesium] assets already up to date (v${version}).`);
        return;
      }
    } catch {
      /* fall through and recopy */
    }
  }

  await mkdir(DEST, { recursive: true });
  for (const dir of REQUIRED) {
    const src = path.join(SRC, dir);
    const dest = path.join(DEST, dir);
    if (!existsSync(src)) {
      console.warn(`[cesium] missing ${src}, skipping.`);
      continue;
    }
    if (existsSync(dest)) {
      await rm(dest, { recursive: true, force: true });
    }
    await cp(src, dest, { recursive: true });
    const s = await stat(dest);
    if (s.isDirectory()) {
      const entries = await readdir(dest);
      console.log(`[cesium] copied ${dir}/  (${entries.length} entries)`);
    }
  }

  // Stamp
  await writeFile(stampPath, version, "utf-8");

  console.log(`[cesium] assets ready at /public/cesium (v${version}).`);
}

main().catch((err) => {
  console.error("[cesium] copy failed:", err);
  process.exit(1);
});
