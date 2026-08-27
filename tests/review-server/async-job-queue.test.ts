import { describe, expect, it } from "vite-plus/test";

import {
  AsyncJobQueue,
  JobQueueError,
  type ModificationJobPayload,
} from "@/tools/review-server/async-job-queue.ts";

function job(taskId: string): ModificationJobPayload {
  return {
    taskId,
    task: {},
    taskMarkdown: `# ${taskId}`,
    executionInstructions: "work safely",
    repository: { gitSha: "a".repeat(40) },
  };
}

describe("AsyncJobQueue", () => {
  it("한 번에 하나씩 FIFO lease하고 progress와 완료 event를 전달한다", async () => {
    const queue = new AsyncJobQueue();
    const events: string[] = [];
    queue.on("progress", ({ status }) => events.push(status));
    queue.on("completed", () => events.push("completed"));
    queue.enqueue(job("task-a"));
    queue.enqueue(job("task-b"));

    const first = await queue.lease("worker-1", 0);
    expect(first?.job.taskId).toBe("task-a");
    expect(await queue.lease("worker-2", 0)).toBeNull();
    queue.progress("task-a", first!.leaseToken, "verifying");
    queue.complete("task-a", first!.leaseToken, { previewUrl: "https://preview.invalid/a" });

    const second = await queue.lease("worker-1", 0);
    expect(second?.job.taskId).toBe("task-b");
    expect(events).toEqual(["verifying", "completed"]);
  });

  it("만료된 lease를 재시도하고 이전 token을 거부한다", async () => {
    let now = 1_000;
    const queue = new AsyncJobQueue({ leaseDurationMs: 100, now: () => now });
    queue.enqueue(job("task-a"));
    const first = await queue.lease("worker-1", 0);
    now += 101;
    const second = await queue.lease("worker-2", 0);

    expect(second?.attempt).toBe(2);
    expect(() => queue.heartbeat("task-a", first!.leaseToken)).toThrow(JobQueueError);
  });
});
