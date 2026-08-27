import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const children = [];

let shuttingDown = false;

function run(command, args, env = process.env) {
  const child = spawn(command, args, { stdio: "inherit", detached: true, env });
  children.push(child);
  child.on("exit", (code) => {
    if (!shuttingDown && code !== 0 && code !== null) shutdown(code);
  });
  return child;
}

function shutdown(exitCode = 0) {
  shuttingDown = true;
  for (const child of children) {
    if (!child.pid || child.exitCode !== null) continue;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());

const gitSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const gitDirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim() !== "";
const repositoryUrl = process.env.VT_REPOSITORY_URL || process.cwd();
const workerToken = randomUUID();
const sharedEnv = {
  ...process.env,
  VT_WORKER_TOKEN: workerToken,
  VT_REPOSITORY_URL: repositoryUrl,
  VITE_REVIEW_GIT_SHA: gitSha,
  VITE_REVIEW_GIT_DIRTY: String(gitDirty),
};

run("node", ["tools/review-server/server.mjs"], sharedEnv);
run("node", ["tools/review-worker/main.ts"], sharedEnv);
run("pnpm", ["run", "dev:live", "--mode", "vt"]);
run("pnpm", ["run", "dev:review", "--mode", "vt"], sharedEnv);

console.log("\nVisual Task review stack:");
console.log("  review console : http://localhost:5175/");
console.log("  game live      : http://localhost:5173/");
console.log("  task gateway   : http://127.0.0.1:8787/health\n");
