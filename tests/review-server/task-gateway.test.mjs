import { EventEmitter } from "node:events";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import {
  buildTaskPrompt,
  TaskGateway,
  TaskGatewayError,
  validateVisualTask,
} from "@/tools/review-server/task-gateway.mjs";

class FakeCodexClient extends EventEmitter {
  constructor() {
    super();
    this.ready = true;
    this.prompts = [];
  }

  async start() {}

  isReady() {
    return this.ready;
  }

  async startTask(prompt) {
    this.prompts.push(prompt);
    return { threadId: "thread-1", turnId: "turn-1" };
  }
}

const temporaryRoots = [];

async function createGateway() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "visual-task-gateway-"));
  temporaryRoots.push(rootDir);
  const client = new FakeCodexClient();
  const gateway = new TaskGateway({ client, rootDir });
  return { client, gateway, rootDir };
}

function visualTask(overrides = {}) {
  return {
    id: "visual-123",
    createdAt: "2026-08-26T12:00:00.000Z",
    instruction: "START 버튼을 아래로 내려줘.",
    target: { id: "start-button", kind: "dom", label: "START" },
    page: { url: "http://localhost:5173", viewport: { width: 1920, height: 1080 } },
    repository: {},
    ...overrides,
  };
}

async function waitForTerminal(gateway, taskId) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const record = gateway.get(taskId);
    if (record?.status === "completed" || record?.status === "failed") return record;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Task did not reach a terminal status");
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { recursive: true })));
});

describe("VisualTask validation", () => {
  it("정상 Task를 허용하고 경로로 사용할 수 없는 id를 거부한다", () => {
    expect(validateVisualTask(visualTask())).toEqual([]);
    expect(validateVisualTask(visualTask({ id: "../escape" }))).toContain("id is invalid");
  });

  it("Codex가 코드 수정 없이 Markdown JSON만 반환하도록 지시한다", () => {
    const prompt = buildTaskPrompt(visualTask());
    expect(prompt).toContain("Do not modify files");
    expect(prompt).toContain("요청 요약");
    expect(prompt).toContain('"id": "visual-123"');
  });
});

describe("Task Gateway", () => {
  it("Task 접수 후 상태를 갱신하고 Markdown을 task 디렉터리에 저장한다", async () => {
    const { client, gateway, rootDir } = await createGateway();
    const response = await gateway.submit(visualTask());
    expect(response).toMatchObject({ taskId: "visual-123", status: "accepted" });
    expect(gateway.get("visual-123").status).toBe("reviewing");

    client.emit("notification", {
      method: "item/agentMessage/delta",
      params: { threadId: "thread-1", turnId: "turn-1", delta: "{" },
    });
    expect(gateway.get("visual-123").status).toBe("editing");

    const text = JSON.stringify({ markdown: "# Task visual-123\n\n## 요청 요약\n버튼 이동" });
    client.emit("notification", {
      method: "turn/completed",
      params: {
        threadId: "thread-1",
        turn: {
          id: "turn-1",
          status: "completed",
          items: [{ id: "message-1", type: "agentMessage", text }],
        },
      },
    });
    expect(await waitForTerminal(gateway, "visual-123")).toMatchObject({
      status: "completed",
      taskFile: "task/visual-123.md",
    });
    expect(await readFile(path.join(rootDir, "task/visual-123.md"), "utf8")).toContain(
      "## 요청 요약",
    );
  });

  it("동시에 두 Task를 접수하거나 같은 id를 재사용하지 않는다", async () => {
    const { gateway } = await createGateway();
    await gateway.submit(visualTask());
    await expect(gateway.submit(visualTask({ id: "visual-456" }))).rejects.toMatchObject({
      code: "task_in_progress",
      status: 409,
    });
  });

  it("실패한 turn을 terminal 실패 상태로 노출한다", async () => {
    const { client, gateway } = await createGateway();
    await gateway.submit(visualTask());
    client.emit("notification", {
      method: "turn/completed",
      params: {
        threadId: "thread-1",
        turn: { id: "turn-1", status: "failed", items: [], error: { message: "quota" } },
      },
    });

    expect(gateway.get("visual-123")).toMatchObject({ status: "failed", error: "quota" });
  });

  it("App Server가 준비되지 않으면 503 오류를 반환한다", async () => {
    const { client, gateway } = await createGateway();
    client.ready = false;
    await expect(gateway.submit(visualTask())).rejects.toEqual(
      expect.objectContaining({ code: "codex_unavailable", status: 503 }),
    );
    expect(TaskGatewayError).toBeTypeOf("function");
  });
});
