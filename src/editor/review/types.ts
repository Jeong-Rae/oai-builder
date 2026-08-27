import type { InspectorTarget } from "@/src/game/inspector/types";

export type { InspectorTarget };

export interface VisualTask {
  id: string;
  createdAt: string;
  instruction: string;
  target: InspectorTarget;
  page: {
    url: string;
    viewport: {
      width: number;
      height: number;
    };
  };
  repository: {
    gitSha: string;
    dirty: boolean;
  };
}

export type TaskStatus =
  | "queued"
  | "reviewing"
  | "ready"
  | "editing"
  | "verifying"
  | "completed"
  | "failed";

export interface TaskSubmissionRecord {
  taskId: string;
  status: "queued";
  receivedAt: string;
}

export interface TaskStatusRecord {
  taskId: string;
  status: TaskStatus;
  receivedAt: string;
  updatedAt: string;
  taskFile?: string;
  previewUrl?: string;
  error?: string;
}

export interface ChatEntry {
  role: "user" | "system" | "error";
  text: string;
  at: string;
}
