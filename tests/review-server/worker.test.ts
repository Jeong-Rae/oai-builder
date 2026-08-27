import { describe, expect, it } from "vite-plus/test";

import { buildModificationPrompt } from "@/tools/review-worker/worker.ts";

describe("VT Worker", () => {
  it("공유 경로 없이 실행 지침과 Task Markdown을 prompt에 포함한다", () => {
    const prompt = buildModificationPrompt({
      taskId: "visual-123",
      task: {},
      taskMarkdown: "# Task visual-123\n\n버튼을 이동한다.",
      executionInstructions: "Do not commit or push.",
      repository: { gitSha: "a".repeat(40) },
    });

    expect(prompt).toContain("Do not commit or push.");
    expect(prompt).toContain("# Task visual-123");
    expect(prompt).toContain("a".repeat(40));
  });
});
