/// <reference types="node" />

import os from "node:os";
import path from "node:path";

import { CodexAppServerClient } from "../review-server/codex-client.mjs";
import { ProcessorClient, TaskWorker } from "./worker.ts";

const processorUrl = process.env.VT_PROCESSOR_URL || "http://127.0.0.1:8787";
const workerToken = process.env.VT_WORKER_TOKEN;
const repositoryUrl = process.env.VT_REPOSITORY_URL;
const workRoot = process.env.VT_WORK_ROOT || path.join(os.tmpdir(), "oai-builder-vt-worker");

if (!workerToken) throw new Error("VT_WORKER_TOKEN is required");
if (!repositoryUrl) throw new Error("VT_REPOSITORY_URL is required");

const codex = new CodexAppServerClient({ cwd: process.cwd() });
codex.on("stderr", (message: string) => process.stderr.write(`[worker-codex] ${message}`));
codex.on("protocolError", (error: Error) => console.error("[worker-codex]", error.message));

const worker = new TaskWorker({
  processor: new ProcessorClient({ baseUrl: processorUrl, token: workerToken }),
  codex,
  repositoryUrl,
  workRoot,
  previewBaseUrl: process.env.VT_FAKE_PREVIEW_BASE_URL,
});

void worker.start().catch((error: Error) => {
  console.error(`[worker] startup failed: ${error.message}`);
  process.exitCode = 1;
});

async function shutdown(): Promise<void> {
  await worker.stop();
}
process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
