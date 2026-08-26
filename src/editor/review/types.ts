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
    gitSha?: string;
  };
}

export interface TaskSubmissionRecord {
  task: VisualTask & { status?: string };
  codexPrompt: string;
  receivedAt: string;
}

export interface ChatEntry {
  role: "user" | "system" | "error";
  text: string;
  at: string;
}
