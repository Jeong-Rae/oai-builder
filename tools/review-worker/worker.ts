/// <reference types="node" />

import { execFile as execFileCallback } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { CodexAppServerClient } from "../review-server/codex-client.mjs";
import type { JobLease, ModificationJobPayload } from "../review-server/async-job-queue.ts";

const execFile = promisify(execFileCallback);

export class ProcessorRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class ProcessorClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor({ baseUrl, token }: { baseUrl: string; token: string }) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.token = token;
  }

  async lease(workerId: string): Promise<JobLease | null> {
    const response = await this.request("/internal/jobs/lease", { workerId });
    return response.status === 204 ? null : ((await response.json()) as JobLease);
  }

  async heartbeat(taskId: string, leaseToken: string): Promise<void> {
    await this.request(`/internal/jobs/${encodeURIComponent(taskId)}/heartbeat`, {}, leaseToken);
  }

  async progress(
    taskId: string,
    leaseToken: string,
    status: "editing" | "verifying",
  ): Promise<void> {
    await this.request(
      `/internal/jobs/${encodeURIComponent(taskId)}/progress`,
      { status },
      leaseToken,
    );
  }

  async complete(taskId: string, leaseToken: string, previewUrl: string): Promise<void> {
    await this.request(
      `/internal/jobs/${encodeURIComponent(taskId)}/complete`,
      { previewUrl },
      leaseToken,
    );
  }

  async fail(
    taskId: string,
    leaseToken: string,
    error: { code: string; message: string },
  ): Promise<void> {
    await this.request(`/internal/jobs/${encodeURIComponent(taskId)}/fail`, error, leaseToken);
  }

  private async request(
    pathname: string,
    body: Record<string, unknown>,
    leaseToken?: string,
  ): Promise<Response> {
    const response = await fetch(`${this.baseUrl}${pathname}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
        ...(leaseToken ? { "x-vt-lease-token": leaseToken } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new ProcessorRequestError(`Processor ${response.status}: ${detail}`, response.status);
    }
    return response;
  }
}

export function buildModificationPrompt(job: ModificationJobPayload): string {
  return [
    job.executionInstructions.trim(),
    "",
    `Task ID: ${job.taskId}`,
    `Git SHA: ${job.repository.gitSha}`,
    "",
    "Task Markdown:",
    job.taskMarkdown.trim(),
  ].join("\n");
}

async function run(command: string, args: string[], cwd?: string): Promise<void> {
  await execFile(command, args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
  });
}

function waitForTurn(
  client: CodexAppServerClient,
  { threadId, turnId }: { threadId: string; turnId: string },
  timeoutMs = 30 * 60_000,
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      clearTimeout(timer);
      client.off("notification", onNotification);
      client.off("exit", onExit);
    };
    const onNotification = (message: Record<string, any>): void => {
      if (message.method !== "turn/completed") return;
      if (message.params?.threadId !== threadId || message.params?.turn?.id !== turnId) return;
      cleanup();
      resolve(message.params.turn);
    };
    const onExit = (error: Error): void => {
      cleanup();
      reject(error);
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Codex modification turn timed out"));
    }, timeoutMs);
    client.on("notification", onNotification);
    client.on("exit", onExit);
  });
}

export class TaskWorker {
  private readonly processor: ProcessorClient;
  private readonly codex: CodexAppServerClient;
  private readonly repositoryUrl: string;
  private readonly workRoot: string;
  private readonly previewBaseUrl: string;
  private readonly workerId: string;
  private stopping = false;

  constructor({
    processor,
    codex,
    repositoryUrl,
    workRoot = path.join(os.tmpdir(), "oai-builder-vt-worker"),
    previewBaseUrl = "https://preview.invalid",
    workerId = `worker-${randomUUID()}`,
  }: {
    processor: ProcessorClient;
    codex: CodexAppServerClient;
    repositoryUrl: string;
    workRoot?: string;
    previewBaseUrl?: string;
    workerId?: string;
  }) {
    this.processor = processor;
    this.codex = codex;
    this.repositoryUrl = repositoryUrl;
    this.workRoot = workRoot;
    this.previewBaseUrl = previewBaseUrl.replace(/\/$/, "");
    this.workerId = workerId;
  }

  async start(): Promise<void> {
    await mkdir(this.workRoot, { recursive: true });
    await this.codex.start();
    while (!this.stopping) {
      let lease: JobLease | null;
      try {
        lease = await this.processor.lease(this.workerId);
      } catch (error) {
        if (this.stopping) break;
        console.error("[worker] Processor unavailable; retrying:", error);
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        continue;
      }
      if (!lease) continue;
      await this.processLease(lease);
    }
  }

  async stop(): Promise<void> {
    this.stopping = true;
    await this.codex.stop();
  }

  private async processLease(lease: JobLease): Promise<void> {
    const { job, leaseToken, attempt } = lease;
    let heartbeatRunning = false;
    const heartbeat = setInterval(() => {
      if (heartbeatRunning) return;
      heartbeatRunning = true;
      void this.processor
        .heartbeat(job.taskId, leaseToken)
        .catch((error) =>
          console.error(`[worker] heartbeat failed for ${job.taskId}:`, error.message),
        )
        .finally(() => {
          heartbeatRunning = false;
        });
    }, 20_000);

    try {
      await this.processor.progress(job.taskId, leaseToken, "editing");
      const workspace = path.join(this.workRoot, `${job.taskId}-attempt-${attempt}`);
      await run("git", ["clone", "--no-checkout", this.repositoryUrl, workspace]);
      await run("git", ["checkout", "--detach", job.repository.gitSha], workspace);
      await run("pnpm", ["install", "--frozen-lockfile"], workspace);

      const identifiers = await this.codex.startModificationTask(
        buildModificationPrompt(job),
        workspace,
      );
      const turn = await waitForTurn(this.codex, identifiers);
      const turnStatus = typeof turn.status === "string" ? turn.status : "unknown";
      if (turnStatus !== "completed") {
        const turnError = turn.error as { message?: string } | undefined;
        throw new Error(turnError?.message ?? `Codex turn ended with ${turnStatus}`);
      }

      await this.processor.progress(job.taskId, leaseToken, "verifying");
      await run("pnpm", ["run", "typecheck"], workspace);
      await run("pnpm", ["run", "build:live"], workspace);
      const previewUrl = `${this.previewBaseUrl}/${encodeURIComponent(job.taskId)}/`;
      await this.processor.complete(job.taskId, leaseToken, previewUrl);
      console.log(`[worker] completed ${job.taskId}; workspace preserved at ${workspace}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.processor
        .fail(job.taskId, leaseToken, { code: "worker_failed", message: message.slice(0, 2_000) })
        .catch((reportError) =>
          console.error(`[worker] failed to report ${job.taskId}:`, reportError.message),
        );
    } finally {
      clearInterval(heartbeat);
    }
  }
}
