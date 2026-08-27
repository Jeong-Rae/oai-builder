import type { TaskStatusRecord, TaskSubmissionRecord, VisualTask } from "@/src/editor/review/types";

const gatewayUrl = (import.meta.env.VITE_REVIEW_GATEWAY_URL as string | undefined) ?? "";

export async function submitVisualTask(task: VisualTask): Promise<TaskSubmissionRecord> {
  const response = await fetch(`${gatewayUrl}/api/tasks`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`gateway ${response.status}: ${detail}`);
  }
  return (await response.json()) as TaskSubmissionRecord;
}

export async function getVisualTask(taskId: string): Promise<TaskStatusRecord> {
  const response = await fetch(`${gatewayUrl}/api/tasks/${encodeURIComponent(taskId)}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`gateway ${response.status}: ${detail}`);
  }
  return (await response.json()) as TaskStatusRecord;
}
