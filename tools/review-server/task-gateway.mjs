import { constants as fsConstants } from "node:fs";
import { access, link, mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const TASK_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);
const STATUS_ORDER = { accepted: 0, reviewing: 1, editing: 2, completed: 3, failed: 3 };

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

export class TaskGateway {
  constructor({ client, rootDir, now = () => new Date().toISOString() }) {
    this.client = client;
    this.rootDir = rootDir;
    this.taskDir = path.join(rootDir, "task");
    this.now = now;
    this.tasks = new Map();
    this.activeTaskId = null;
    this.client.on("notification", (message) => this.handleNotification(message));
    this.client.on("exit", (error) => this.failActive(error));
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
    if (this.activeTaskId) {
      throw new TaskGatewayError("Another task is already in progress", {
        code: "task_in_progress",
        status: 409,
      });
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
      status: "accepted",
      receivedAt,
      updatedAt: receivedAt,
      threadId: null,
      turnId: null,
      taskFile: null,
      error: null,
      markdownResponse: null,
    };
    this.tasks.set(task.id, record);
    this.activeTaskId = task.id;

    try {
      const identifiers = await this.client.startTask(buildTaskPrompt(task));
      record.threadId = identifiers.threadId;
      record.turnId = identifiers.turnId;
      this.update(record, "reviewing");
      return { taskId: record.taskId, status: "accepted", receivedAt: record.receivedAt };
    } catch (error) {
      this.fail(record, error);
      throw new TaskGatewayError("Codex App Server rejected the task", {
        code: "codex_unavailable",
        status: 503,
      });
    }
  }

  handleNotification(message) {
    const record = this.activeTaskId ? this.tasks.get(this.activeTaskId) : null;
    if (!record || TERMINAL_STATUSES.has(record.status)) return;
    const params = message.params ?? {};
    if (record.threadId && params.threadId && params.threadId !== record.threadId) return;
    if (record.turnId && params.turnId && params.turnId !== record.turnId) return;

    if (message.method === "item/agentMessage/delta") {
      this.update(record, "editing");
      return;
    }
    if (message.method === "item/completed" && params.item?.type === "agentMessage") {
      record.markdownResponse = params.item.text;
      this.update(record, "editing");
      return;
    }
    if (message.method === "turn/completed") void this.complete(record, params.turn);
  }

  async complete(record, turn) {
    if (TERMINAL_STATUSES.has(record.status)) return;
    if (turn?.status !== "completed") {
      this.fail(record, new Error(turn?.error?.message ?? `Turn ended with ${turn?.status}`));
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
      this.update(record, "completed");
      this.activeTaskId = null;
    } catch (error) {
      this.fail(record, error);
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
    if (record) this.fail(record, error);
  }

  publicRecord(record) {
    return {
      taskId: record.taskId,
      status: record.status,
      receivedAt: record.receivedAt,
      updatedAt: record.updatedAt,
      ...(record.taskFile ? { taskFile: record.taskFile } : {}),
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
