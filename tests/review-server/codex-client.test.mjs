import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";

import { describe, expect, it } from "vite-plus/test";

import { CodexAppServerClient } from "@/tools/review-server/codex-client.mjs";

function fakeProcess(messages) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.exitCode = null;
  child.kill = () => {
    child.exitCode = 0;
  };
  child.stdin.on("data", (chunk) => {
    for (const line of chunk.toString().trim().split("\n")) {
      const message = JSON.parse(line);
      messages.push(message);
      if (message.method === "initialize") {
        queueMicrotask(() =>
          child.stdout.write(`${JSON.stringify({ id: message.id, result: {} })}\n`),
        );
      }
      if (message.method === "thread/start") {
        queueMicrotask(() =>
          child.stdout.write(
            `${JSON.stringify({ id: message.id, result: { thread: { id: "thread-1" } } })}\n`,
          ),
        );
      }
      if (message.method === "turn/start") {
        queueMicrotask(() =>
          child.stdout.write(
            `${JSON.stringify({ id: message.id, result: { turn: { id: "turn-1" } } })}\n`,
          ),
        );
      }
    }
  });
  return child;
}

describe("Codex App Server client", () => {
  it("stdio 연결을 초기화하고 읽기 전용 thread와 turn을 시작한다", async () => {
    const messages = [];
    const child = fakeProcess(messages);
    const client = new CodexAppServerClient({
      cwd: "/workspace/project",
      spawnProcess: () => child,
      requestTimeoutMs: 1_000,
    });

    await client.start();
    const identifiers = await client.startTask("task prompt");

    expect(identifiers).toEqual({ threadId: "thread-1", turnId: "turn-1" });
    expect(messages.map((message) => message.method)).toEqual([
      "initialize",
      "initialized",
      "thread/start",
      "turn/start",
    ]);
    expect(messages[2].params).toMatchObject({
      cwd: "/workspace/project",
      approvalPolicy: "never",
      sandbox: "read-only",
      ephemeral: true,
    });
    expect(messages[3].params).toMatchObject({
      threadId: "thread-1",
      sandboxPolicy: { type: "readOnly", networkAccess: false },
      outputSchema: { required: ["markdown"] },
    });

    await client.stop();
  });

  it("App Server notification을 구독자에게 전달한다", async () => {
    const messages = [];
    const child = fakeProcess(messages);
    const client = new CodexAppServerClient({
      cwd: "/workspace/project",
      spawnProcess: () => child,
    });
    const notifications = [];
    client.on("notification", (message) => notifications.push(message));
    await client.start();

    child.stdout.write('{"method":"turn/completed","params":{"threadId":"thread-1"}}\n');
    await new Promise((resolve) => setImmediate(resolve));

    expect(notifications).toEqual([{ method: "turn/completed", params: { threadId: "thread-1" } }]);
    await client.stop();
  });
});
