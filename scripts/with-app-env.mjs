#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ENV_REL_PATH = ".grok/app-env.json";
const VITE_PREFIX = "VITE_";

function loadAppEnv() {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const path = join(dir, "..", APP_ENV_REL_PATH);
    const raw = readFileSync(path, "utf8");
    const data = JSON.parse(raw);
    for (const [k, v] of Object.entries(data)) {
      if (k.startsWith(VITE_PREFIX) && process.env[k] === undefined) {
        process.env[k] = String(v);
      }
    }
  } catch {}
}

loadAppEnv();
const args = process.argv.slice(2);
if (args.length === 0) process.exit(1);
const child = spawn(args[0], args.slice(1), { stdio: "inherit", env: process.env, shell: false });
child.on("exit", (code) => process.exit(code ?? 1));
