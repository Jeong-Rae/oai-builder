import backgroundUrl from "@/assets/background/background_space.webp";
import plateButtonUrl from "@/assets/button/button_plate.webp";
import goalStarUrl from "@/assets/goal/goal.star.webp";
import introTitleUrl from "@/assets/title/title_point.webp";
import startLunarUrl from "@/assets/moon/moon.eclepse.trimmed.webp";
import startMascot1Url from "@/assets/mascot/mascot.happy.1.webp";
import startMascot2Url from "@/assets/mascot/mascot.happy.2.webp";
import clearSparkUrl from "@/assets/star/star_plus_gold_s.webp";
import clearStarUrl from "@/assets/star/star.webp";
import chapterStarUrl from "@/assets/star/star_stell_gold_m.webp";
import chapterArrowLeftUrl from "@/assets/arrow/arrow_carousel_left.webp";
import chapterArrowRightUrl from "@/assets/arrow/arrow_carousel_right.webp";
import stageSelectClearedUrl from "@/assets/star/star_node_gold.webp";
import stageSelectInProgressUrl from "@/assets/star/star_node_white.webp";
import stageSelectLockedUrl from "@/assets/star/star_node_black.webp";
import lockUrl from "@/assets/lock/lock.gray.webp";
import backFrameUrl from "@/assets/button/button_back.webp";
import arrowBackUrl from "@/assets/button/arrow_back.webp";
import bubbleNextUrl from "@/assets/button/button_bubble.webp";
import decorStarSmallUrl from "@/assets/star/star_cross_s.webp";
import decorStarMediumUrl from "@/assets/star/star_cross_m.webp";
import decorStarLargeUrl from "@/assets/star/star_cross_l.webp";
import decorMoonUrl from "@/assets/moon/moon.circle.webp";
import decorMascotUrl from "@/assets/mascot/mascot.135deg.webp";
import { assetUrls } from "./features/presentation";
import { chapters } from "./stages";

export { backgroundUrl, plateButtonUrl, goalStarUrl };

export const introAssets = { title: introTitleUrl } as const;

export const startAssets = {
  lunar: startLunarUrl,
  mascots: [startMascot1Url, startMascot2Url],
} as const;

export const clearAssets = { spark: clearSparkUrl, star: clearStarUrl } as const;

export const chapterAssets = {
  constellationStar: chapterStarUrl,
  arrowLeft: chapterArrowLeftUrl,
  arrowRight: chapterArrowRightUrl,
} as const;

export const stageSelectAssets = {
  clearedStarNode: stageSelectClearedUrl,
  inProgressStarNode: stageSelectInProgressUrl,
  lockedStarNode: stageSelectLockedUrl,
  lock: lockUrl,
  backFrame: backFrameUrl,
  arrowBack: arrowBackUrl,
  bubbleNext: bubbleNextUrl,
} as const;

export const decorAssets = {
  starSmall: decorStarSmallUrl,
  starMedium: decorStarMediumUrl,
  starLarge: decorStarLargeUrl,
  moon: decorMoonUrl,
  mascot: decorMascotUrl,
} as const;

export function allGameAssetUrls(): string[] {
  return Array.from(
    new Set([
      backgroundUrl,
      plateButtonUrl,
      goalStarUrl,
      ...Object.values(introAssets),
      ...startAssets.mascots,
      startAssets.lunar,
      ...Object.values(clearAssets),
      ...Object.values(chapterAssets),
      ...Object.values(stageSelectAssets),
      ...Object.values(decorAssets),
      ...Object.values(assetUrls),
      ...chapters.map((chapter) => chapter.zodiacUrl),
    ]),
  );
}
