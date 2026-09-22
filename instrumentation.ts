import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync } from "node:fs";
import path from "node:path";

export function register() {
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.SKIP_WP_MEDIA_SYNC === "1") return;

  const script = existsSync("/app/download-wp-uploads.mjs")
    ? "/app/download-wp-uploads.mjs"
    : path.join(process.cwd(), "scripts", "download-wp-uploads.mjs");
  if (!existsSync(script)) return;

  const dest = path.join(process.cwd(), "public", "wp-content");
  mkdirSync(dest, { recursive: true });
  const logFd = openSync(path.join(dest, "download.log"), "a");
  const child = spawn(process.execPath, [script], {
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: {
      ...process.env,
      WP_MEDIA_DEST: dest,
    },
  });
  child.unref();
}
