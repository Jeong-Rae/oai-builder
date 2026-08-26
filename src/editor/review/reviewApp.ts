import { createBridgeClient } from "@/src/editor/review/bridgeClient";
import { submitVisualTask } from "@/src/editor/review/taskClient";
import { resolveSiblingUrl } from "@/src/editor/review/urls";
import type { ChatEntry, InspectorTarget, VisualTask } from "@/src/editor/review/types";
import { isCommentModeShortcut } from "@/src/game/inspector/shortcut";
import "@/src/editor/review/review.css";

const gameUrl =
  (import.meta.env.VITE_REVIEW_GAME_URL as string | undefined) ?? resolveSiblingUrl(5173);

interface TargetItem {
  target: InspectorTarget;
  selectedAt: string;
}

export function mountReviewApp(root: HTMLElement): () => void {
  root.classList.add("review-root");
  root.innerHTML = `
    <header class="review-masthead">
      <div class="masthead-title">
        <p class="eyebrow">VISUAL COMMENT / GAME LIVE</p>
        <h1>Review Console</h1>
      </div>
      <div class="masthead-actions">
        <span class="gateway-chip" data-gateway-chip>GATEWAY :8787</span>
        <button
          type="button"
          class="mode-toggle"
          data-mode-toggle
          role="switch"
          aria-checked="false"
          aria-keyshortcuts="Shift+V"
          title="Comment Mode 전환 (Shift+V)"
        >
          <span class="mode-toggle-label">Comment Mode</span>
          <span class="mode-toggle-track" aria-hidden="true">
            <span class="mode-toggle-knob"></span>
          </span>
        </button>
      </div>
    </header>
    <main class="review-body">
      <section class="game-stage" data-game-stage aria-label="게임 라이브 화면"></section>
      <aside class="review-sidebar">
        <section class="panel target-panel">
          <p class="section-label">Selected Elements</p>
          <div class="target-list" data-target-list role="list"></div>
          <p class="empty-hint" data-empty-hint>
            Comment Mode를 켜고 게임에서 요소를 클릭하세요.
          </p>
        </section>
        <section class="panel composer-panel">
          <p class="section-label">Comment</p>
          <div class="chat-log" data-chat-log aria-live="polite"></div>
          <form class="composer" data-composer>
            <textarea
              name="instruction"
              rows="3"
              placeholder="예) START 버튼을 지금보다 40px 아래로 내려줘."
              required
            ></textarea>
            <div class="composer-actions">
              <button type="button" class="attach-button" title="파일 첨부 (준비 중)">
                Attach
              </button>
              <button type="submit" class="send-button">Send</button>
            </div>
          </form>
        </section>
      </aside>
    </main>
  `;

  const stage = root.querySelector<HTMLElement>("[data-game-stage]")!;
  const modeToggle = root.querySelector<HTMLButtonElement>("[data-mode-toggle]")!;
  const targetList = root.querySelector<HTMLElement>("[data-target-list]")!;
  const emptyHint = root.querySelector<HTMLElement>("[data-empty-hint]")!;
  const chatLog = root.querySelector<HTMLElement>("[data-chat-log]")!;
  const composer = root.querySelector<HTMLFormElement>("[data-composer]")!;
  const textarea = composer.querySelector<HTMLTextAreaElement>("textarea")!;
  const sendButton = composer.querySelector<HTMLButtonElement>(".send-button")!;

  const items = new Map<string, TargetItem>();
  let activeTargetId: string | null = null;
  let bridge: ReturnType<typeof createBridgeClient> | null = null;
  let commentMode = false;
  let submitting = false;

  const renderChatEntry = (entry: ChatEntry): void => {
    const bubble = document.createElement("div");
    bubble.className = `chat-entry is-${entry.role}`;
    bubble.textContent = entry.text;
    chatLog.append(bubble);
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const renderPendingEntry = (): HTMLElement => {
    const skeleton = document.createElement("div");
    skeleton.className = "chat-entry chat-skeleton";
    skeleton.setAttribute("role", "status");
    skeleton.setAttribute("aria-label", "전송 중");
    skeleton.innerHTML = `
      <span class="chat-skeleton-line is-long"></span>
      <span class="chat-skeleton-line is-medium"></span>
      <span class="chat-skeleton-line is-short"></span>
    `;
    chatLog.append(skeleton);
    chatLog.scrollTop = chatLog.scrollHeight;
    return skeleton;
  };

  const setActiveTarget = (id: string): void => {
    activeTargetId = id;
    for (const node of targetList.querySelectorAll<HTMLElement>("[data-target-item]")) {
      node.classList.toggle("is-active", node.dataset.targetItem === id);
    }
  };

  const renderTargetItem = ({ target, selectedAt }: TargetItem): HTMLElement => {
    const item = document.createElement("article");
    item.className = "target-item";
    item.dataset.targetItem = target.id;
    item.setAttribute("role", "listitem");

    const header = document.createElement("button");
    header.type = "button";
    header.className = "target-summary";
    header.innerHTML = `
      <span class="target-chevron" aria-hidden="true">▾</span>
      <span class="target-name"></span>
      <span class="target-kind-chip"></span>
    `;
    header.querySelector<HTMLElement>(".target-name")!.textContent = target.label ?? target.id;
    header.querySelector<HTMLElement>(".target-kind-chip")!.textContent = target.kind;

    const details = document.createElement("dl");
    details.className = "target-details";
    const rows: Array<[string, string]> = [
      ["id", target.id],
      ["kind", target.kind],
      [
        "bounds",
        target.bounds
          ? `${target.bounds.x}, ${target.bounds.y} · ${target.bounds.width}×${target.bounds.height}`
          : "-",
      ],
      [
        "source",
        target.source?.file
          ? `${target.source.file}${target.source.symbol ? ` · ${target.source.symbol}` : ""}`
          : "-",
      ],
      ["selected", new Date(selectedAt).toLocaleTimeString()],
    ];
    for (const [key, value] of rows) {
      const term = document.createElement("dt");
      term.textContent = key;
      const description = document.createElement("dd");
      description.textContent = value;
      details.append(term, description);
    }

    header.addEventListener("click", () => {
      item.classList.toggle("is-open");
    });
    item.addEventListener("click", () => setActiveTarget(target.id));

    item.append(header, details);
    return item;
  };

  const addTarget = (target: InspectorTarget): void => {
    if (!items.has(target.id)) {
      const record = { target, selectedAt: new Date().toISOString() };
      items.set(target.id, record);
      emptyHint.hidden = true;
      targetList.append(renderTargetItem(record));
    }
    setActiveTarget(target.id);
  };

  const buildVisualTask = (instruction: string): VisualTask => {
    const active = activeTargetId ? items.get(activeTargetId)?.target : undefined;
    if (!active) {
      throw new Error("선택된 element가 없습니다. 먼저 게임 화면에서 대상을 클릭하세요.");
    }
    return {
      id: `visual-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      instruction,
      target: active,
      page: {
        url: gameUrl,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      },
      repository: {},
    };
  };

  composer.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;
    const instruction = textarea.value.trim();
    if (!instruction) return;
    let task: VisualTask;
    try {
      task = buildVisualTask(instruction);
    } catch (error) {
      renderChatEntry({
        role: "error",
        text: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      });
      return;
    }
    renderChatEntry({ role: "user", text: instruction, at: task.createdAt });
    textarea.value = "";
    submitting = true;
    sendButton.disabled = true;
    const pendingEntry = renderPendingEntry();
    try {
      const record = await submitVisualTask(task);
      renderChatEntry({
        role: "system",
        text: `[${record.task.id}] ${record.task.status ?? "queued"} · codex prompt 생성 완료 (${record.codexPrompt.length} chars)`,
        at: record.receivedAt,
      });
    } catch (error) {
      renderChatEntry({
        role: "error",
        text: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
      });
    } finally {
      pendingEntry.remove();
      submitting = false;
      sendButton.disabled = false;
    }
  });

  const setCommentMode = (enabled: boolean): void => {
    commentMode = enabled;
    modeToggle.setAttribute("aria-checked", String(commentMode));
    modeToggle.classList.toggle("is-on", commentMode);
    stage.classList.toggle("is-comment-mode", commentMode);
    bridge?.setCommentMode(commentMode);
  };

  const toggleCommentMode = (): void => setCommentMode(!commentMode);

  const onShortcut = (event: KeyboardEvent): void => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable)
    ) {
      return;
    }
    if (!isCommentModeShortcut(event)) return;
    event.preventDefault();
    toggleCommentMode();
  };

  modeToggle.addEventListener("click", () => {
    toggleCommentMode();
  });
  window.addEventListener("keydown", onShortcut);

  bridge = createBridgeClient(stage, gameUrl, addTarget, toggleCommentMode);

  return () => {
    bridge?.destroy();
    bridge = null;
    window.removeEventListener("keydown", onShortcut);
    root.classList.remove("review-root");
    root.innerHTML = "";
  };
}
