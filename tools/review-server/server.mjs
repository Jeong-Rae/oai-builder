import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { CodexAppServerClient } from "./codex-client.mjs";
import { TaskGateway, TaskGatewayError } from "./task-gateway.mjs";

const PORT = Number(process.env.REVIEW_SERVER_PORT || 8787);
const HOST = process.env.REVIEW_SERVER_HOST || "127.0.0.1";
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MAX_BODY_BYTES = 1_000_000;

const codex = new CodexAppServerClient({ cwd: ROOT_DIR });
const gateway = new TaskGateway({ client: codex, rootDir: ROOT_DIR });

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(status === 204 ? undefined : JSON.stringify(body, null, 2));
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw new TaskGatewayError("Request body is too large", {
        code: "body_too_large",
        status: 413,
      });
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new TaskGatewayError("Request body is not valid JSON", {
      code: "invalid_json",
      status: 400,
    });
  }
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});

    if (req.method === "GET" && req.url === "/health") {
      return json(res, gateway.isReady() ? 200 : 503, {
        ok: gateway.isReady(),
        service: "oai-builder-review-server",
        codexAppServer: gateway.isReady() ? "ready" : "unavailable",
      });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/tasks/")) {
      const id = decodeURIComponent(req.url.slice("/api/tasks/".length));
      const task = gateway.get(id);
      return task ? json(res, 200, task) : json(res, 404, { error: "task_not_found" });
    }

    if (req.method === "POST" && req.url === "/api/tasks") {
      const task = await readJson(req);
      return json(res, 202, await gateway.submit(task));
    }

    return json(res, 404, { error: "not_found" });
  } catch (error) {
    const status = error instanceof TaskGatewayError ? error.status : 500;
    const code = error instanceof TaskGatewayError ? error.code : "internal_error";
    const details = error instanceof TaskGatewayError ? error.details : undefined;
    return json(res, status, { error: code, ...(details ? { details } : {}) });
  }
});

codex.on("stderr", (message) => process.stderr.write(`[codex-app-server] ${message}`));
codex.on("protocolError", (error) => console.error("[codex-app-server]", error.message));

void gateway.start().catch((error) => {
  console.error(`[codex-app-server] startup failed: ${error.message}`);
});

server.listen(PORT, HOST, () => {
  console.log(`Visual Comment Task Gateway listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  await codex.stop();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
