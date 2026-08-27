import { constants as fsConstants } from "node:fs";
import { access, link, mkdir, unlink, writeFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import path from "node:path";

const TASK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);
const STATUS_ORDER = {
  queued: 0,
  reviewing: 1,
  ready: 2,
  editing: 3,
  verifying: 4,
  completed: 5,
  failed: 5,
};
const GIT_SHA_PATTERN = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;

export class TaskGatewayError extends Error {
  constructor(message, { code = "task_gateway_error", status = 500, details } = {}) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function validateVisualTask(task) {
  const errors = [];
  if (!task || typeof task !== "object" || Array.isArray(task)) return ["body must be an object"];
  if (!TASK_ID_PATTERN.test(task.id ?? "")) errors.push("id is invalid");
  if (!task.createdAt || Number.isNaN(Date.parse(task.createdAt))) {
    errors.push("createdAt must be an ISO date");
  }
  if (!task.instruction?.trim()) errors.push("instruction is required");
  if (!task.target?.id) errors.push("target.id is required");
  if (!task.target?.kind) errors.push("target.kind is required");
  if (!task.page?.url) errors.push("page.url is required");
  if (!Number.isFinite(task.page?.viewport?.width) || task.page.viewport.width <= 0) {
    errors.push("page.viewport.width must be positive");
  }
  if (!Number.isFinite(task.page?.viewport?.height) || task.page.viewport.height <= 0) {
    errors.push("page.viewport.height must be positive");
  }
  if (!GIT_SHA_PATTERN.test(task.repository?.gitSha ?? "")) {
    errors.push("repository.gitSha must be a full commit SHA");
  }
  if (task.repository?.dirty !== false) {
    errors.push("repository must describe a clean build");
  }
  return errors;
}

export function buildTaskPrompt(task) {
  return [
    "You are preparing a task intake document for a game development team.",
    "Do not modify files, run commands, implement code, or request additional information.",
    "Return only the JSON object required by the output schema.",
    "The markdown value must be a complete Korean Markdown document with these sections:",
    "1. A title containing the task id",
    "2. 요청 요약",
    "3. 선택 대상 (id, kind, label, bounds, source)",
    "4. 실행 환경 (page URL, viewport, git SHA when present)",
    "5. 원본 VisualTask JSON in a fenced json block",
    "Do not invent user identity or implementation details. Preserve the request faithfully.",
    "",
    "VisualTask:",
    JSON.stringify(task, null, 2),
  ].join("\n");
}

function safeError(error) {
  if (error instanceof TaskGatewayError) return error.message;
  return error instanceof Error ? error.message : "Unknown task processing error";
}

function agentMessageFromTurn(turn, fallback) {
  const messages = Array.isArray(turn?.items)
    ? turn.items.filter((item) => item?.type === "agentMessage" && typeof item.text === "string")
    : [];
  return messages.at(-1)?.text ?? fallback;
}

export class TaskGateway extends EventEmitter {
  constructor({
    client,
    rootDir,
    jobQueue,
    executionInstructions = "",
    capacity = 100,
    now = () => new Date().toISOString(),
  }) {
    super();
    this.client = client;
    this.rootDir = rootDir;
    this.taskDir = path.join(rootDir, "task");
    this.jobQueue = jobQueue;
    this.executionInstructions = executionInstructions;
    this.capacity = capacity;
    this.now = now;
    this.tasks = new Map();
    this.pendingTaskIds = [];
    this.activeTaskId = null;
    this.client.on("notification", (message) => this.handleNotification(message));
    this.client.on("exit", (error) => this.failActive(error));
    this.on("taskReady", (job) => this.jobQueue.enqueue(job));
    this.jobQueue?.on("leased", ({ taskId }) => this.updateById(taskId, "editing"));
    this.jobQueue?.on("progress", ({ taskId, status }) => this.updateById(taskId, status));
    this.jobQueue?.on("completed", ({ taskId, result }) =>
      this.completeModification(taskId, result),
    );
    this.jobQueue?.on("failed", ({ taskId, error }) => this.failById(taskId, error));
  }

  async start() {
    await this.client.start();
  }

  isReady() {
    return this.client.isReady();
  }

  get(taskId) {
    const record = this.tasks.get(taskId);
    return record ? this.publicRecord(record) : null;
  }

  async submit(task) {
    const errors = validateVisualTask(task);
    if (errors.length) {
      throw new TaskGatewayError("Invalid VisualTask", {
        code: "invalid_visual_task",
        status: 422,
        details: errors,
      });
    }
    if (!this.isReady()) {
      throw new TaskGatewayError("Codex App Server is not ready", {
        code: "codex_unavailable",
        status: 503,
      });
    }
    const outstanding = [...this.tasks.values()].filter(
      (record) => !TERMINAL_STATUSES.has(record.status),
    ).length;
    if (outstanding >= this.capacity) {
      throw new TaskGatewayError("Task queue is full", { code: "queue_full", status: 429 });
    }
    if (this.tasks.has(task.id) || (await this.taskFileExists(task.id))) {
      throw new TaskGatewayError("Task id already exists", {
        code: "task_conflict",
        status: 409,
      });
    }

    const receivedAt = this.now();
    const record = {
      task,
      taskId: task.id,
      status: "queued",
      receivedAt,
      updatedAt: receivedAt,
      threadId: null,
      turnId: null,
      taskFile: null,
      error: null,
      markdownResponse: null,
      previewUrl: null,
    };
    this.tasks.set(task.id, record);
    this.pendingTaskIds.push(task.id);
    void this.drainIntake();
    return { taskId: record.taskId, status: "queued", receivedAt: record.receivedAt };
  }

  async drainIntake() {
    if (this.activeTaskId) return;
    const taskId = this.pendingTaskIds.shift();
    if (!taskId) return;
    const record = this.tasks.get(taskId);
    if (!record || TERMINAL_STATUSES.has(record.status)) return void this.drainIntake();
    this.activeTaskId = taskId;
    try {
      const identifiers = await this.client.startTask(buildTaskPrompt(record.task));
      record.threadId = identifiers.threadId;
      record.turnId = identifiers.turnId;
      this.update(record, "reviewing");
    } catch (error) {
      this.fail(record, error);
      void this.drainIntake();
    }
  }

  handleNotification(message) {
    const record = this.activeTaskId ? this.tasks.get(this.activeTaskId) : null;
    if (!record || TERMINAL_STATUSES.has(record.status)) return;
    const params = message.params ?? {};
    if (record.threadId && params.threadId && params.threadId !== record.threadId) return;
    if (record.turnId && params.turnId && params.turnId !== record.turnId) return;

    if (message.method === "item/agentMessage/delta") return;
    if (message.method === "item/completed" && params.item?.type === "agentMessage") {
      record.markdownResponse = params.item.text;
      return;
    }
    if (message.method === "turn/completed") void this.complete(record, params.turn);
  }

  async complete(record, turn) {
    if (TERMINAL_STATUSES.has(record.status)) return;
    if (turn?.status !== "completed") {
      this.fail(record, new Error(turn?.error?.message ?? `Turn ended with ${turn?.status}`));
      void this.drainIntake();
      return;
    }
    try {
      const text = agentMessageFromTurn(turn, record.markdownResponse);
      if (!text?.trim()) throw new Error("Codex returned an empty task document");
      const parsed = JSON.parse(text);
      if (typeof parsed?.markdown !== "string" || !parsed.markdown.trim()) {
        throw new Error("Codex returned an invalid task document");
      }
      record.taskFile = await this.saveMarkdown(record.taskId, parsed.markdown);
      this.update(record, "ready");
      this.emit("taskReady", {
        taskId: record.taskId,
        task: record.task,
        taskMarkdown: parsed.markdown,
        executionInstructions: this.executionInstructions,
        repository: { gitSha: record.task.repository.gitSha },
      });
      this.activeTaskId = null;
      void this.drainIntake();
    } catch (error) {
      this.fail(record, error);
      void this.drainIntake();
    }
  }

  update(record, status) {
    if (STATUS_ORDER[status] < STATUS_ORDER[record.status]) return;
    record.status = status;
    record.updatedAt = this.now();
  }

  fail(record, error) {
    record.error = safeError(error);
    this.update(record, "failed");
    if (this.activeTaskId === record.taskId) this.activeTaskId = null;
  }

  failActive(error) {
    const record = this.activeTaskId ? this.tasks.get(this.activeTaskId) : null;
    if (record) {
      this.fail(record, error);
      void this.drainIntake();
    }
  }

  updateById(taskId, status) {
    const record = this.tasks.get(taskId);
    if (record && !TERMINAL_STATUSES.has(record.status)) this.update(record, status);
  }

  completeModification(taskId, result) {
    const record = this.tasks.get(taskId);
    if (!record || TERMINAL_STATUSES.has(record.status)) return;
    record.previewUrl = result.previewUrl;
    this.update(record, "completed");
  }

  failById(taskId, error) {
    const record = this.tasks.get(taskId);
    if (record && !TERMINAL_STATUSES.has(record.status)) {
      this.fail(record, new Error(error?.message ?? String(error)));
    }
  }

  publicRecord(record) {
    return {
      taskId: record.taskId,
      status: record.status,
      receivedAt: record.receivedAt,
      updatedAt: record.updatedAt,
      ...(record.taskFile ? { taskFile: record.taskFile } : {}),
      ...(record.previewUrl ? { previewUrl: record.previewUrl } : {}),
      ...(record.error ? { error: record.error } : {}),
    };
  }

  async taskFileExists(taskId) {
    try {
      await access(path.join(this.taskDir, `${taskId}.md`), fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async saveMarkdown(taskId, markdown) {
    await mkdir(this.taskDir, { recursive: true });
    const targetName = `${taskId}.md`;
    const targetPath = path.join(this.taskDir, targetName);
    const temporaryPath = path.join(this.taskDir, `.${taskId}.${process.pid}.${Date.now()}.tmp`);
    try {
      await writeFile(temporaryPath, `${markdown.trim()}\n`, { flag: "wx" });
      await link(temporaryPath, targetPath);
    } finally {
      await unlink(temporaryPath).catch(() => {});
    }
    return path.posix.join("task", targetName);
  }
}
