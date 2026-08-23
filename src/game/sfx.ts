import buttonUrl from "@/assets/sfx/button/sfx.button.mp3";
import clearUrl from "@/assets/sfx/clear/sfx.clear.mp3";
import clickUrl from "@/assets/sfx/click/sfx.click.mp3";
import moveUrl from "@/assets/sfx/move/sfx.move.mp3";

const urls = { button: buttonUrl, clear: clearUrl, click: clickUrl, move: moveUrl } as const;
const players = new Map<string, HTMLAudioElement>();

function playerFor(name: keyof typeof urls): HTMLAudioElement {
  let player = players.get(name);
  if (!player) {
    player = new Audio(urls[name]);
    player.preload = "auto";
    players.set(name, player);
  }
  return player;
}

export function preloadSfx(): void {
  (Object.keys(urls) as Array<keyof typeof urls>).forEach((name) => playerFor(name).load());
}

export function playSfx(name: keyof typeof urls): void {
  const player = playerFor(name);
  player.currentTime = 0;
  void player.play().catch(() => {});
}
