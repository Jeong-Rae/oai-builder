import buttonUrl from "@/assets/sfx/button/sfx.button.mp3";
import clearUrl from "@/assets/sfx/clear/sfx.clear.mp3";
import clickUrl from "@/assets/sfx/click/sfx.click.mp3";
import moveUrl from "@/assets/sfx/move/sfx.move.mp3";
import swooshUrl from "@/assets/sfx/swoosh/sfx.swoosh.mp3";
import typingUrl from "@/assets/sfx/typing/sfx.typing.mp3";

const urls = {
  button: buttonUrl,
  clear: clearUrl,
  click: clickUrl,
  move: moveUrl,
  swoosh: swooshUrl,
  typing: typingUrl,
} as const;
type SfxName = keyof typeof urls;

const volume = 0.5;
let context: AudioContext | undefined;
const buffers = new Map<SfxName, Promise<AudioBuffer>>();
const activeSources = new Map<SfxName, AudioBufferSourceNode>();
const requestIds = new Map<SfxName, number>();

function audioContext(): AudioContext {
  context ??= new AudioContext();
  return context;
}

function loadSfx(name: SfxName): Promise<AudioBuffer> {
  let buffer = buffers.get(name);
  if (buffer) return buffer;

  const audio = audioContext();
  buffer = fetch(urls[name])
    .then((response) => {
      if (!response.ok) throw new Error(`SFX를 불러오지 못했습니다: ${name}`);
      return response.arrayBuffer();
    })
    .then((data) => audio.decodeAudioData(data));
  buffers.set(name, buffer);
  return buffer;
}

export function preloadSfx(): void {
  (Object.keys(urls) as SfxName[]).forEach((name) => void loadSfx(name).catch(() => {}));
}

export function playSfx(name: SfxName): void {
  const audio = audioContext();
  const requestId = (requestIds.get(name) ?? 0) + 1;
  requestIds.set(name, requestId);

  const ready = audio.state === "suspended" ? audio.resume() : Promise.resolve();
  void Promise.all([ready, loadSfx(name)])
    .then(([, buffer]) => {
      if (requestIds.get(name) !== requestId) return;

      activeSources.get(name)?.stop();
      const source = audio.createBufferSource();
      const gain = audio.createGain();
      source.buffer = buffer;
      gain.gain.value = volume;
      source.connect(gain);
      gain.connect(audio.destination);
      source.addEventListener("ended", () => {
        if (activeSources.get(name) === source) activeSources.delete(name);
      });
      activeSources.set(name, source);
      source.start();
    })
    .catch(() => {});
}
