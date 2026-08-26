interface ShortcutKeyEvent {
  key: string;
  code?: string;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  repeat?: boolean;
}

export function isCommentModeShortcut(event: ShortcutKeyEvent): boolean {
  const isV = event.code === "KeyV" || event.key.toLowerCase() === "v";
  return (
    isV && event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey && !event.repeat
  );
}
