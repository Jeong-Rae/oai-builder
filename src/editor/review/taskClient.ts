import type { TaskSubmissionRecord, VisualTask } from "@/src/editor/review/types";
import { resolveSiblingUrl } from "@/src/editor/review/urls";

const gatewayUrl =
  (import.meta.env.VITE_REVIEW_GATEWAY_URL as string | undefined) ?? resolveSiblingUrl(8787);

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
