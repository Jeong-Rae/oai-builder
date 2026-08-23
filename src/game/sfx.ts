import buttonUrl from "@/assets/sfx/button/dragon-studio-button-press-2-386176.mp3";
import clearUrl from "@/assets/sfx/clear/benkirb-shine-9-268911.mp3";
import clickUrl from "@/assets/sfx/click/soundreality-sound-of-mouse-click-4-478760.mp3";
import moveUrl from "@/assets/sfx/move/eaglaxle-tiles-footsteps-2-455126.trimmed.mp3";

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
