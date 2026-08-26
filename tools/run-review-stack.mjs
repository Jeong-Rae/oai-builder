import { spawn } from "node:child_process";

const children = [];

let shuttingDown = false;

function run(command, args) {
  const child = spawn(command, args, { stdio: "inherit", detached: true });
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

run("node", ["tools/review-server/server.mjs"]);
run("pnpm", ["run", "dev:live", "--mode", "vt"]);
run("pnpm", ["run", "dev:review", "--mode", "vt"]);

console.log("\nVisual Task review stack:");
console.log("  review console : http://localhost:5175/");
console.log("  game live      : http://localhost:5173/");
console.log("  task gateway   : http://127.0.0.1:8787/health\n");
