/// <reference types="node" />

import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

export interface ModificationJobPayload {
  taskId: string;
  task: Record<string, unknown>;
  taskMarkdown: string;
  executionInstructions: string;
  repository: { gitSha: string };
}

export interface JobLease {
  job: ModificationJobPayload;
  attempt: number;
  leaseToken: string;
  leaseExpiresAt: string;
}

interface QueueRecord {
  payload: ModificationJobPayload;
  status: "queued" | "leased" | "completed" | "failed";
  attempt: number;
  workerId: string | null;
  leaseToken: string | null;
  leaseExpiresAtMs: number | null;
}

export class JobQueueError extends Error {
  code: string;
  status: number;

  constructor(message: string, { code, status }: { code: string; status: number }) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class AsyncJobQueue extends EventEmitter {
  private readonly jobs = new Map<string, QueueRecord>();
  private readonly waitingTaskIds: string[] = [];
  private readonly leaseDurationMs: number;
  private readonly maxAttempts: number;
  private readonly now: () => number;

  constructor({
    leaseDurationMs = 60_000,
    maxAttempts = 3,
    now = Date.now,
  }: {
    leaseDurationMs?: number;
    maxAttempts?: number;
    now?: () => number;
  } = {}) {
    super();
    this.leaseDurationMs = leaseDurationMs;
    this.maxAttempts = maxAttempts;
    this.now = now;
  }

  enqueue(payload: ModificationJobPayload): void {
    if (this.jobs.has(payload.taskId)) {
      throw new JobQueueError("Job already exists", { code: "job_conflict", status: 409 });
    }
    this.jobs.set(payload.taskId, {
      payload,
      status: "queued",
      attempt: 0,
      workerId: null,
      leaseToken: null,
      leaseExpiresAtMs: null,
    });
    this.waitingTaskIds.push(payload.taskId);
    this.emit("available");
    this.emit("enqueued", { taskId: payload.taskId });
  }

  async lease(workerId: string, waitMs = 20_000): Promise<JobLease | null> {
    const immediate = this.tryLease(workerId);
    if (immediate || waitMs <= 0) return immediate;

    await new Promise<void>((resolve) => {
      const finish = (): void => {
        clearTimeout(timer);
        this.off("available", finish);
        resolve();
      };
      const timer = setTimeout(finish, waitMs);
      this.once("available", finish);
    });
    return this.tryLease(workerId);
  }

  heartbeat(taskId: string, leaseToken: string): string {
    const record = this.requireLease(taskId, leaseToken);
    record.leaseExpiresAtMs = this.now() + this.leaseDurationMs;
    return new Date(record.leaseExpiresAtMs).toISOString();
  }

  progress(taskId: string, leaseToken: string, status: "editing" | "verifying"): void {
    this.requireLease(taskId, leaseToken);
    this.emit("progress", { taskId, status });
  }

  complete(taskId: string, leaseToken: string, result: { previewUrl: string }): void {
    const record = this.requireLease(taskId, leaseToken);
    record.status = "completed";
    record.leaseExpiresAtMs = null;
    this.emit("completed", { taskId, result });
    this.emit("available");
  }

  fail(taskId: string, leaseToken: string, error: { code?: string; message: string }): void {
    const record = this.requireLease(taskId, leaseToken);
    record.status = "failed";
    record.leaseExpiresAtMs = null;
    this.emit("failed", { taskId, error });
    this.emit("available");
  }

  stats(): { queued: number; leased: number } {
    this.requeueExpired();
    let queued = 0;
    let leased = 0;
    for (const record of this.jobs.values()) {
      if (record.status === "queued") queued += 1;
      if (record.status === "leased") leased += 1;
    }
    return { queued, leased };
  }

  private tryLease(workerId: string): JobLease | null {
    this.requeueExpired();
    if ([...this.jobs.values()].some((record) => record.status === "leased")) return null;

    while (this.waitingTaskIds.length > 0) {
      const taskId = this.waitingTaskIds.shift()!;
      const record = this.jobs.get(taskId);
      if (!record || record.status !== "queued") continue;
      record.status = "leased";
      record.attempt += 1;
      record.workerId = workerId;
      const leaseToken = randomUUID();
      record.leaseToken = leaseToken;
      record.leaseExpiresAtMs = this.now() + this.leaseDurationMs;
      const lease: JobLease = {
        job: record.payload,
        attempt: record.attempt,
        leaseToken,
        leaseExpiresAt: new Date(record.leaseExpiresAtMs).toISOString(),
      };
      this.emit("leased", { taskId, workerId, attempt: record.attempt });
      return lease;
    }
    return null;
  }

  private requeueExpired(): void {
    const now = this.now();
    for (const [taskId, record] of this.jobs) {
      if (
        record.status !== "leased" ||
        record.leaseExpiresAtMs === null ||
        record.leaseExpiresAtMs > now
      ) {
        continue;
      }
      record.workerId = null;
      record.leaseToken = null;
      record.leaseExpiresAtMs = null;
      if (record.attempt >= this.maxAttempts) {
        record.status = "failed";
        this.emit("failed", {
          taskId,
          error: { code: "lease_expired", message: "Worker lease expired too many times" },
        });
      } else {
        record.status = "queued";
        this.waitingTaskIds.push(taskId);
        this.emit("available");
      }
    }
  }

  private requireLease(taskId: string, leaseToken: string): QueueRecord {
    this.requeueExpired();
    const record = this.jobs.get(taskId);
    if (
      !record ||
      record.status !== "leased" ||
      !record.leaseToken ||
      record.leaseToken !== leaseToken
    ) {
      throw new JobQueueError("Lease is no longer active", {
        code: "stale_lease",
        status: 409,
      });
    }
    return record;
  }
}
