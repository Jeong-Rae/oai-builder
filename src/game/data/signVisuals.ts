import type { ZodiacSign } from "@/src/game/stages";

const ariesChapterActiveLineUrl = new URL(
  "@/assets/constellation/line.aries.chapter.state-active.svg",
  import.meta.url,
).href;
const ariesChapterInactiveLineUrl = new URL(
  "@/assets/constellation/line.aries.chapter.state-inactive.svg",
  import.meta.url,
).href;
const ariesChapterSmallActiveLineUrl = new URL(
  "@/assets/constellation/line.aries.chapter.small.state-active.svg",
  import.meta.url,
).href;
const ariesStageLineUrl = new URL("@/assets/constellation/line.aries.stage.svg", import.meta.url)
  .href;
const cancerChapterActiveLineUrl = new URL(
  "@/assets/constellation/line.cancer.chapter.state-active.svg",
  import.meta.url,
).href;
const cancerChapterInactiveLineUrl = new URL(
  "@/assets/constellation/line.cancer.chapter.state-inactive.svg",
  import.meta.url,
).href;
const cancerChapterLockedLineUrl = new URL(
  "@/assets/constellation/line.cancer.chapter.state-locked.svg",
  import.meta.url,
).href;
const cancerChapterSmallActiveLineUrl = new URL(
  "@/assets/constellation/line.cancer.chapter.small.state-active.svg",
  import.meta.url,
).href;
const geminiChapterActiveLineUrl = new URL(
  "@/assets/constellation/line.gemini.chapter.state-active.svg",
  import.meta.url,
).href;
const geminiChapterInactiveLineUrl = new URL(
  "@/assets/constellation/line.gemini.chapter.state-inactive.svg",
  import.meta.url,
).href;
const geminiChapterLockedLineUrl = new URL(
  "@/assets/constellation/line.gemini.chapter.state-locked.svg",
  import.meta.url,
).href;
const geminiChapterSmallActiveLineUrl = new URL(
  "@/assets/constellation/line.gemini.chapter.small.state-active.svg",
  import.meta.url,
).href;
const taurusChapterActiveLineUrl = new URL(
  "@/assets/constellation/line.taurus.chapter.state-active.svg",
  import.meta.url,
).href;
const taurusChapterInactiveLineUrl = new URL(
  "@/assets/constellation/line.taurus.chapter.state-inactive.svg",
  import.meta.url,
).href;
const taurusChapterLockedLineUrl = new URL(
  "@/assets/constellation/line.taurus.chapter.state-locked.svg",
  import.meta.url,
).href;
const taurusChapterSmallActiveLineUrl = new URL(
  "@/assets/constellation/line.taurus.chapter.small.state-active.svg",
  import.meta.url,
).href;
const taurusStageLineUrl = new URL("@/assets/constellation/line.taurus.stage.svg", import.meta.url)
  .href;

export interface SignStarVisual {
  x: number;
  y: number;
  size: number;
  rotation?: number;
}

export interface SignLineVisual {
  url: string;
  activeUrl?: string;
  inactiveUrl?: string;
  lockedUrl?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  centered?: boolean;
}

export interface SignEmblemVisual {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ChapterSignVisual {
  width: number;
  height: number;
  stars: readonly SignStarVisual[];
  line: SignLineVisual;
  emblem: SignEmblemVisual;
}

export interface StageSignVisual {
  stars: readonly (SignStarVisual & { labelX: number; labelY: number })[];
  line: SignLineVisual;
}

export interface SignVisual {
  chapter: { large: ChapterSignVisual; small: ChapterSignVisual };
  stage?: StageSignVisual;
}

export const signVisuals: Partial<Record<ZodiacSign, SignVisual>> = {
  ARIES: {
    chapter: {
      large: {
        width: 478,
        height: 560,
        stars: [
          { x: 70.67, y: 277.55, size: 62.75, rotation: -26.23 },
          { x: 182.39, y: 104.33, size: 73.79, rotation: -26.23 },
          { x: 274.61, y: 62.27, size: 55.86, rotation: -26.23 },
          { x: 359.29, y: 50.88, size: 62.06, rotation: -26.23 },
        ],
        line: {
          url: ariesChapterActiveLineUrl,
          inactiveUrl: ariesChapterInactiveLineUrl,
          x: 238.71,
          y: 180.26,
          width: 381.08,
          height: 134.69,
          rotation: -26.23,
          centered: true,
        },
        emblem: { x: 184.06, y: 430, width: 109.88, height: 90 },
      },
      small: {
        width: 384,
        height: 450,
        stars: [
          { x: 79.59, y: 189.17, size: 41.63, rotation: -26.23 },
          { x: 153.7, y: 74.26, size: 48.95, rotation: -26.23 },
          { x: 214.88, y: 46.35, size: 37.05, rotation: -26.23 },
          { x: 271.06, y: 38.8, size: 41.17, rotation: -26.23 },
        ],
        line: {
          url: ariesChapterInactiveLineUrl,
          activeUrl: ariesChapterSmallActiveLineUrl,
          x: 191.07,
          y: 124.63,
          width: 256,
          height: 94,
          rotation: -26.23,
          centered: true,
        },
        emblem: { x: 149, y: 336, width: 85.47, height: 70 },
      },
    },
    stage: {
      line: { url: ariesStageLineUrl, x: 701.1, y: 398, width: 552, height: 348 },
      stars: [
        { x: 575, y: 614, size: 247, labelX: 699, labelY: 859 },
        { x: 837, y: 398, size: 151, labelX: 913, labelY: 555 },
        { x: 1019, y: 342, size: 132, labelX: 1085, labelY: 481 },
        { x: 1187, y: 330, size: 125, labelX: 1250, labelY: 464 },
      ],
    },
  },
  TAURUS: {
    chapter: {
      large: {
        width: 478,
        height: 560,
        stars: [
          { x: 81, y: 49, size: 60 },
          { x: 48, y: 131, size: 66 },
          { x: 176, y: 127, size: 43 },
          { x: 178, y: 207, size: 36 },
          { x: 203, y: 166, size: 36 },
          { x: 208, y: 199, size: 28 },
          { x: 233, y: 201, size: 28 },
          { x: 211, y: 229, size: 24 },
          { x: 240, y: 226, size: 28 },
          { x: 269, y: 247, size: 51 },
          { x: 372, y: 290, size: 33 },
          { x: 379, y: 323, size: 51 },
        ],
        line: {
          url: taurusChapterActiveLineUrl,
          inactiveUrl: taurusChapterInactiveLineUrl,
          lockedUrl: taurusChapterLockedLineUrl,
          x: 69.84,
          y: 68.54,
          width: 348,
          height: 293,
        },
        emblem: { x: 195.99, y: 430, width: 86.03, height: 90 },
      },
      small: {
        width: 384,
        height: 450,
        stars: [
          { x: 71.23, y: 44, size: 45.86 },
          { x: 46, y: 106.68, size: 50.45 },
          { x: 143.84, y: 103.62, size: 32.87 },
          { x: 145.37, y: 164.77, size: 27.52 },
          { x: 164.48, y: 133.43, size: 27.52 },
          { x: 168.3, y: 158.66, size: 21.4 },
          { x: 187.41, y: 160.19, size: 21.4 },
          { x: 170.6, y: 181.59, size: 18.35 },
          { x: 192.76, y: 179.3, size: 21.4 },
          { x: 214.93, y: 195.35, size: 38.98 },
          { x: 293.67, y: 228.22, size: 25.23 },
          { x: 299.02, y: 253.45, size: 38.98 },
        ],
        line: {
          url: taurusChapterInactiveLineUrl,
          activeUrl: taurusChapterSmallActiveLineUrl,
          x: 62.05,
          y: 58.13,
          width: 268,
          height: 226,
        },
        emblem: { x: 159, y: 336, width: 66.91, height: 70 },
      },
    },
    stage: {
      line: {
        url: taurusStageLineUrl,
        x: 376,
        y: 330.1,
        width: 1261,
        height: 413,
      },
      stars: [
        { x: 279, y: 229, size: 191.81, labelX: 376, labelY: 420 },
        { x: 408.55, y: 591.31, size: 229.69, labelX: 523, labelY: 811 },
        { x: 635.54, y: 368.04, size: 156.38, labelX: 714, labelY: 527 },
        { x: 790.05, y: 453.82, size: 125.84, labelX: 853, labelY: 585 },
        { x: 826.47, y: 673.6, size: 125.84, labelX: 889, labelY: 807 },
        { x: 886.77, y: 560.15, size: 106.29, labelX: 940, labelY: 676 },
        { x: 956.39, y: 651.3, size: 90.41, labelX: 1002, labelY: 750 },
        { x: 967.75, y: 476.4, size: 111.18, labelX: 1023, labelY: 598 },
        { x: 1031.19, y: 583.11, size: 111.18, labelX: 1087, labelY: 701 },
        { x: 1142.8, y: 566.57, size: 173.49, labelX: 1230, labelY: 740 },
        { x: 1474.77, y: 506.2, size: 140.5, labelX: 1545, labelY: 651 },
        { x: 1567.72, y: 612.67, size: 128.28, labelX: 1635, labelY: 748 },
      ],
    },
  },
  GEMINI: {
    chapter: {
      large: {
        width: 478,
        height: 560,
        stars: [
          { x: 44, y: 173, size: 58 },
          { x: 44, y: 103, size: 58 },
          { x: 94, y: 139, size: 43 },
          { x: 111, y: 55, size: 43 },
          { x: 174, y: 89, size: 43 },
          { x: 237, y: 34, size: 43 },
          { x: 144, y: 209, size: 43 },
          { x: 137, y: 280, size: 62 },
          { x: 203, y: 231, size: 49 },
          { x: 259, y: 146, size: 71 },
          { x: 274, y: 356, size: 42 },
          { x: 299, y: 289, size: 53 },
          { x: 335, y: 236, size: 39 },
          { x: 352, y: 189, size: 42 },
          { x: 394, y: 181, size: 42 },
        ],
        line: {
          url: geminiChapterActiveLineUrl,
          inactiveUrl: geminiChapterInactiveLineUrl,
          lockedUrl: geminiChapterLockedLineUrl,
          x: 62.77,
          y: 46.62,
          width: 363,
          height: 345,
        },
        emblem: { x: 200.3, y: 430, width: 77.4, height: 90 },
      },
      small: {
        width: 384,
        height: 450,
        stars: [
          { x: 47, y: 136.83, size: 42.91 },
          { x: 47, y: 85.05, size: 42.91 },
          { x: 83.99, y: 111.68, size: 31.81 },
          { x: 96.57, y: 49.54, size: 31.81 },
          { x: 143.17, y: 74.69, size: 31.81 },
          { x: 189.78, y: 34, size: 31.81 },
          { x: 120.98, y: 163.46, size: 31.81 },
          { x: 115.8, y: 215.99, size: 45.87 },
          { x: 164.63, y: 179.74, size: 36.25 },
          { x: 206.06, y: 116.86, size: 52.53 },
          { x: 217.15, y: 272.21, size: 31.07 },
          { x: 235.65, y: 222.65, size: 39.21 },
          { x: 262.28, y: 183.44, size: 28.85 },
          { x: 274.86, y: 148.67, size: 31.07 },
          { x: 305.93, y: 142.75, size: 31.07 },
        ],
        line: {
          url: geminiChapterInactiveLineUrl,
          activeUrl: geminiChapterSmallActiveLineUrl,
          x: 59.82,
          y: 42.25,
          width: 270,
          height: 258,
        },
        emblem: { x: 162, y: 336, width: 60.2, height: 70 },
      },
    },
  },
  CANCER: {
    chapter: {
      large: {
        width: 478,
        height: 560,
        stars: [
          { x: 28, y: 71, size: 66 },
          { x: 142, y: 134, size: 53 },
          { x: 195, y: 113, size: 41 },
          { x: 195, y: 174, size: 46 },
          { x: 251, y: 271, size: 65 },
          { x: 366, y: 127, size: 70 },
          { x: 236, y: 134, size: 29 },
        ],
        line: {
          url: cancerChapterActiveLineUrl,
          inactiveUrl: cancerChapterInactiveLineUrl,
          lockedUrl: cancerChapterLockedLineUrl,
          x: 51.35,
          y: 95.29,
          width: 360,
          height: 224,
        },
        emblem: { x: 192.99, y: 430, width: 92.71, height: 90 },
      },
      small: {
        width: 384,
        height: 450,
        stars: [
          { x: 31, y: 51, size: 52.05 },
          { x: 120.91, y: 100.69, size: 41.8 },
          { x: 162.71, y: 84.12, size: 32.34 },
          { x: 162.71, y: 132.23, size: 36.28 },
          { x: 206.88, y: 208.74, size: 51.26 },
          { x: 297.57, y: 95.17, size: 55.21 },
          { x: 195.05, y: 100.69, size: 22.87 },
        ],
        line: {
          url: cancerChapterInactiveLineUrl,
          activeUrl: cancerChapterSmallActiveLineUrl,
          x: 49.04,
          y: 69.58,
          width: 285,
          height: 178,
        },
        emblem: { x: 156, y: 336, width: 72.11, height: 70 },
      },
    },
  },
};
