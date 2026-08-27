/// <reference types="node" />

import { timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AsyncJobQueue, JobQueueError } from "./async-job-queue.ts";
import { CodexAppServerClient } from "./codex-client.mjs";
import { TaskGateway, TaskGatewayError } from "./task-gateway.mjs";

const PORT = Number(process.env.REVIEW_SERVER_PORT || 8787);
const HOST = process.env.REVIEW_SERVER_HOST || "127.0.0.1";
const WORKER_TOKEN = process.env.VT_WORKER_TOKEN;
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MAX_BODY_BYTES = 1_000_000;

if (!WORKER_TOKEN) throw new Error("VT_WORKER_TOKEN is required");

const executionInstructions = await readFile(
  path.join(ROOT_DIR, "agent/instructions/vt-worker-execution.md"),
  "utf8",
);
const codex = new CodexAppServerClient({ cwd: ROOT_DIR });
const jobQueue = new AsyncJobQueue();
const gateway = new TaskGateway({
  client: codex,
  rootDir: ROOT_DIR,
  jobQueue,
  executionInstructions,
  capacity: Number(process.env.VT_QUEUE_CAPACITY || 100),
});

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization,content-type,x-vt-lease-token",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(status === 204 ? undefined : JSON.stringify(body, null, 2));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
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
    const parsed = JSON.parse(body);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new TaskGatewayError("Request body is not valid JSON", {
      code: "invalid_json",
      status: 400,
    });
  }
}

function requireWorker(req: IncomingMessage): void {
  const provided = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
  const expected = Buffer.from(WORKER_TOKEN!);
  const received = Buffer.from(provided);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new TaskGatewayError("Worker authentication failed", {
      code: "worker_unauthorized",
      status: 401,
    });
  }
}

function leaseToken(req: IncomingMessage): string {
  const token = req.headers["x-vt-lease-token"];
  if (typeof token !== "string" || !token) {
    throw new TaskGatewayError("Lease token is required", {
      code: "lease_token_required",
      status: 400,
    });
  }
  return token;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 204, {});
    if (req.method === "GET" && req.url === "/health") {
      return json(res, gateway.isReady() ? 200 : 503, {
        ok: gateway.isReady(),
        service: "oai-builder-task-processor",
        codexAppServer: gateway.isReady() ? "ready" : "unavailable",
        queue: jobQueue.stats(),
      });
    }
    if (req.method === "GET" && req.url?.startsWith("/api/tasks/")) {
      const id = decodeURIComponent(req.url.slice("/api/tasks/".length));
      const task = gateway.get(id);
      return task ? json(res, 200, task) : json(res, 404, { error: "task_not_found" });
    }
    if (req.method === "POST" && req.url === "/api/tasks") {
      return json(res, 202, await gateway.submit(await readJson(req)));
    }
    if (req.method === "POST" && req.url === "/internal/jobs/lease") {
      requireWorker(req);
      const body = await readJson(req);
      if (typeof body.workerId !== "string" || !body.workerId.trim()) {
        throw new TaskGatewayError("workerId is required", {
          code: "invalid_worker",
          status: 400,
        });
      }
      const lease = await jobQueue.lease(body.workerId, 20_000);
      return lease ? json(res, 200, lease) : json(res, 204, {});
    }

    const workerRoute = req.url?.match(
      /^\/internal\/jobs\/([A-Za-z0-9][A-Za-z0-9._-]{0,127})\/(heartbeat|progress|complete|fail)$/,
    );
    if (req.method === "POST" && workerRoute) {
      requireWorker(req);
      const [, taskId, action] = workerRoute;
      const token = leaseToken(req);
      if (action === "heartbeat") {
        return json(res, 200, { leaseExpiresAt: jobQueue.heartbeat(taskId, token) });
      }
      const body = await readJson(req);
      if (action === "progress") {
        if (body.status !== "editing" && body.status !== "verifying") {
          throw new TaskGatewayError("Invalid progress status", {
            code: "invalid_progress",
            status: 400,
          });
        }
        jobQueue.progress(taskId, token, body.status);
        return json(res, 200, { ok: true });
      }
      if (action === "complete") {
        if (typeof body.previewUrl !== "string" || !/^https?:\/\//.test(body.previewUrl)) {
          throw new TaskGatewayError("previewUrl is required", {
            code: "invalid_result",
            status: 400,
          });
        }
        jobQueue.complete(taskId, token, { previewUrl: body.previewUrl });
        return json(res, 200, { ok: true });
      }
      jobQueue.fail(taskId, token, {
        ...(typeof body.code === "string" ? { code: body.code } : {}),
        message: typeof body.message === "string" ? body.message : "Worker failed",
      });
      return json(res, 200, { ok: true });
    }
    return json(res, 404, { error: "not_found" });
  } catch (error) {
    const known = error instanceof TaskGatewayError || error instanceof JobQueueError;
    const status = known ? error.status : 500;
    const code = known ? error.code : "internal_error";
    const details = error instanceof TaskGatewayError ? error.details : undefined;
    return json(res, status, { error: code, ...(details ? { details } : {}) });
  }
});

codex.on("stderr", (message: string) => process.stderr.write(`[codex-app-server] ${message}`));
codex.on("protocolError", (error: Error) => console.error("[codex-app-server]", error.message));
void gateway.start().catch((error: Error) => {
  console.error(`[codex-app-server] startup failed: ${error.message}`);
});
server.listen(PORT, HOST, () =>
  console.log(`VT Task Processor listening on http://${HOST}:${PORT}`),
);

let shuttingDown = false;
async function shutdown(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  await codex.stop();
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
