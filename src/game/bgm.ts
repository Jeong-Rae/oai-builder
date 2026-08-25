import ariesUrl from "@/assets/sfx/bgm/Aries.mp3";
import entireUrl from "@/assets/sfx/bgm/Entire.mp3";
import taurusUrl from "@/assets/sfx/bgm/Taurus.mp3";
import tutorialUrl from "@/assets/sfx/bgm/Tutorial.mp3";
import type { ZodiacSign } from "@/src/game/stages";

const urls = {
  entire: entireUrl,
  tutorial: tutorialUrl,
  aries: ariesUrl,
  taurus: taurusUrl,
} as const;

export type BgmTrack = keyof typeof urls;

const volume = 0.5;
const fadeDuration = 300;
const players = new Map<BgmTrack, HTMLAudioElement>();
let targetTrack: BgmTrack | undefined;
let fadeFrame: number | undefined;

function playerFor(track: BgmTrack): HTMLAudioElement {
  let player = players.get(track);
  if (!player) {
    player = new Audio(urls[track]);
    player.loop = true;
    player.preload = "auto";
    player.volume = 0;
    players.set(track, player);
  }
  return player;
}

function tryPlay(player: HTMLAudioElement): void {
  void player.play().catch(() => {});
}

export function preloadBgm(): void {
  (Object.keys(urls) as BgmTrack[]).forEach((track) => playerFor(track).load());
}

export function setBgm(track: BgmTrack): void {
  if (targetTrack === track) return;

  const firstTrack = targetTrack === undefined;
  targetTrack = track;
  const target = playerFor(track);
  tryPlay(target);

  if (fadeFrame !== undefined) cancelAnimationFrame(fadeFrame);
  if (firstTrack) {
    target.volume = volume;
    return;
  }

  const startedAt = performance.now();
  const startingVolumes = new Map(
    [...players].map(([name, player]) => [name, player.volume] as const),
  );
  const fade = (now: number): void => {
    const progress = Math.min((now - startedAt) / fadeDuration, 1);
    players.forEach((player, name) => {
      const start = startingVolumes.get(name) ?? 0;
      player.volume = start + ((name === track ? volume : 0) - start) * progress;
    });
    if (progress < 1) {
      fadeFrame = requestAnimationFrame(fade);
      return;
    }
    fadeFrame = undefined;
    players.forEach((player, name) => {
      if (name !== track) player.pause();
    });
  };
  fadeFrame = requestAnimationFrame(fade);
}

export function resumeBgm(): void {
  if (targetTrack) tryPlay(playerFor(targetTrack));
}

export function bgmForChapter(sign: ZodiacSign): BgmTrack {
  if (sign === "ARIES") return "aries";
  if (sign === "TAURUS") return "taurus";
  return "entire";
}
