import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import readline from "node:readline";

const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

function rpcError(error) {
  const result = new Error(error?.message || "Codex App Server request failed");
  result.code = error?.code;
  return result;
}

export class CodexAppServerClient extends EventEmitter {
  constructor({ cwd, spawnProcess = spawn, requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS }) {
    super();
    this.cwd = cwd;
    this.spawnProcess = spawnProcess;
    this.requestTimeoutMs = requestTimeoutMs;
    this.nextRequestId = 1;
    this.pending = new Map();
    this.process = null;
    this.lines = null;
    this.ready = false;
    this.startPromise = null;
    this.stopping = false;
  }

  isReady() {
    return this.ready;
  }

  async start() {
    if (this.ready) return;
    if (this.startPromise) return this.startPromise;
    this.startPromise = this.startProcess();
    try {
      await this.startPromise;
    } catch (error) {
      await this.stop();
      throw error;
    } finally {
      this.startPromise = null;
    }
  }

  async startProcess() {
    this.stopping = false;
    const child = this.spawnProcess("codex", ["app-server", "--listen", "stdio://"], {
      cwd: this.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.process = child;
    this.lines = readline.createInterface({ input: child.stdout });
    this.lines.on("line", (line) => this.handleLine(line));
    child.stderr.on("data", (chunk) => this.emit("stderr", chunk.toString()));
    child.once("error", (error) => {
      if (this.process === child) this.handleExit(error);
    });
    child.once("exit", (code, signal) => {
      if (this.stopping || this.process !== child) return;
      this.handleExit(new Error(`Codex App Server exited (${signal ?? code ?? "unknown"})`));
    });

    await this.request("initialize", {
      clientInfo: {
        name: "oai_builder_visual_task_gateway",
        title: "OAI Builder Visual Task Gateway",
        version: "0.1.0",
      },
    });
    this.notify("initialized", {});
    this.ready = true;
    this.emit("ready");
  }

  async startTask(prompt) {
    if (!this.ready) throw new Error("Codex App Server is not ready");
    const threadResult = await this.request("thread/start", {
      cwd: this.cwd,
      approvalPolicy: "never",
      sandbox: "read-only",
      ephemeral: true,
    });
    const threadId = threadResult?.thread?.id;
    if (!threadId) throw new Error("Codex App Server did not return a thread id");

    const turnResult = await this.request("turn/start", {
      threadId,
      cwd: this.cwd,
      approvalPolicy: "never",
      sandboxPolicy: { type: "readOnly", networkAccess: false },
      input: [{ type: "text", text: prompt }],
      outputSchema: {
        type: "object",
        additionalProperties: false,
        properties: { markdown: { type: "string" } },
        required: ["markdown"],
      },
    });
    const turnId = turnResult?.turn?.id;
    if (!turnId) throw new Error("Codex App Server did not return a turn id");
    return { threadId, turnId };
  }

  request(method, params) {
    if (!this.process?.stdin?.writable) {
      return Promise.reject(new Error("Codex App Server transport is unavailable"));
    }
    const id = this.nextRequestId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Codex App Server request timed out: ${method}`));
      }, this.requestTimeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.process.stdin.write(`${JSON.stringify({ method, id, params })}\n`);
    });
  }

  notify(method, params) {
    if (!this.process?.stdin?.writable) return;
    this.process.stdin.write(`${JSON.stringify({ method, params })}\n`);
  }

  handleLine(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      this.emit("protocolError", new Error("Codex App Server returned invalid JSON"));
      return;
    }
    if (message.id !== undefined) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(message.id);
      if (message.error) pending.reject(rpcError(message.error));
      else pending.resolve(message.result);
      return;
    }
    if (typeof message.method === "string") this.emit("notification", message);
  }

  handleExit(error) {
    this.ready = false;
    this.lines?.close();
    this.lines = null;
    this.process = null;
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
    this.emit("exit", error);
  }

  async stop() {
    this.stopping = true;
    this.ready = false;
    this.lines?.close();
    this.lines = null;
    const child = this.process;
    this.process = null;
    if (child && child.exitCode === null) child.kill("SIGTERM");
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Codex App Server stopped"));
    }
    this.pending.clear();
  }
}
