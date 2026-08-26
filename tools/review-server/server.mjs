import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.REVIEW_SERVER_PORT || 8787);
const HOST = process.env.REVIEW_SERVER_HOST || "127.0.0.1";

const tasks = new Map();

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body, null, 2));
}

function validateVisualTask(task) {
  const errors = [];
  if (!task || typeof task !== "object") errors.push("body must be an object");
  if (!task?.instruction?.trim()) errors.push("instruction is required");
  if (!task?.target?.id) errors.push("target.id is required");
  if (!task?.target?.kind) errors.push("target.kind is required");
  if (!task?.page?.url) errors.push("page.url is required");
  return errors;
}

function buildCodexPrompt(task) {
  return [
    "$game-comment-flow",
    "",
    `Execute visual task ${task.id}.`,
    "",
    "Treat the VisualTask JSON below as authoritative visual/runtime context.",
    "First validate the target and source mapping. Then implement the smallest safe change.",
    "Use project AGENTS.md rules and existing package.json scripts for verification.",
    "",
    "VisualTask:",
    "```json",
    JSON.stringify(task, null, 2),
    "```",
  ].join("\n");
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, {});

  if (req.method === "GET" && req.url === "/health") {
    return json(res, 200, { ok: true, service: "oai-builder-review-server" });
  }

  if (req.method === "GET" && req.url?.startsWith("/api/tasks/")) {
    const id = decodeURIComponent(req.url.slice("/api/tasks/".length));
    const task = tasks.get(id);
    return task ? json(res, 200, task) : json(res, 404, { error: "task_not_found" });
  }

  if (req.method === "POST" && req.url === "/api/tasks") {
    let body = "";
    for await (const chunk of req) body += chunk;

    let task;
    try {
      task = JSON.parse(body);
    } catch {
      return json(res, 400, { error: "invalid_json" });
    }

    const errors = validateVisualTask(task);
    if (errors.length) {
      return json(res, 422, { error: "invalid_visual_task", details: errors });
    }

    task.id ||= `visual-${randomUUID()}`;
    task.status = "queued";

    const record = {
      task,
      codexPrompt: buildCodexPrompt(task),
      receivedAt: new Date().toISOString(),
    };

    tasks.set(task.id, record);

    // V1 boundary:
    // This gateway intentionally stops at generating a deterministic Codex payload.
    // The next adapter should send record.codexPrompt to Codex App Server and stream
    // thread/turn events back into task.status.
    return json(res, 202, record);
  }

  return json(res, 404, { error: "not_found" });
});

server.listen(PORT, HOST, () => {
  console.log(`Visual Comment Task Gateway listening on http://${HOST}:${PORT}`);
});
