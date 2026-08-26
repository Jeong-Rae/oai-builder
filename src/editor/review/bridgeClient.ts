import type {
  GameToWrapperMessage,
  InspectorTarget,
  WrapperToGameMessage,
} from "@/src/game/inspector/types";

export interface BridgeClient {
  setCommentMode(enabled: boolean): void;
  destroy(): void;
}

export function createBridgeClient(
  container: HTMLElement,
  gameUrl: string,
  onTargetSelected: (target: InspectorTarget) => void,
  onToggleRequested: () => void,
): BridgeClient {
  const iframe = document.createElement("iframe");
  iframe.className = "review-game-frame";
  iframe.src = gameUrl;
  iframe.title = "Game Live";
  iframe.allow = "fullscreen";
  container.append(iframe);
  let commentModeEnabled = false;

  const postToGame = (message: unknown): void => {
    iframe.contentWindow?.postMessage(message, new URL(gameUrl).origin);
  };

  const onMessage = (event: MessageEvent<WrapperToGameMessage | GameToWrapperMessage>): void => {
    if (event.source !== iframe.contentWindow) return;
    if (event.origin !== new URL(gameUrl).origin) return;
    if (!event.data || typeof event.data !== "object" || !("type" in event.data)) return;
    if (event.data.type === "inspector:ready") {
      postToGame({
        type: "inspector:mode",
        enabled: commentModeEnabled,
      } satisfies WrapperToGameMessage);
      return;
    }
    if (event.data.type === "inspector:toggle-request") {
      onToggleRequested();
      return;
    }
    if (event.data.type === "inspector:selected") {
      onTargetSelected(event.data.target);
    }
  };

  window.addEventListener("message", onMessage);

  return {
    setCommentMode(enabled) {
      commentModeEnabled = enabled;
      postToGame({ type: "inspector:mode", enabled } satisfies WrapperToGameMessage);
    },
    destroy() {
      window.removeEventListener("message", onMessage);
      iframe.remove();
    },
  };
}
