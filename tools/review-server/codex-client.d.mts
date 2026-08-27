/// <reference types="node" />

import { EventEmitter } from "node:events";

export interface TaskIdentifiers {
  threadId: string;
  turnId: string;
}

export class CodexAppServerClient extends EventEmitter {
  constructor(options: {
    cwd: string;
    spawnProcess?: (...args: any[]) => any;
    requestTimeoutMs?: number;
  });
  isReady(): boolean;
  start(): Promise<void>;
  startTask(prompt: string): Promise<TaskIdentifiers>;
  startModificationTask(prompt: string, cwd: string): Promise<TaskIdentifiers>;
  request(method: string, params: Record<string, unknown>): Promise<any>;
  notify(method: string, params: Record<string, unknown>): void;
  stop(): Promise<void>;
}
