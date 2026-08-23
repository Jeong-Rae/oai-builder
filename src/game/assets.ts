import backgroundUrl from "@/assets/background/background.space.webp";
import plateButtonUrl from "@/assets/button/button.plate.webp";
import goalStarUrl from "@/assets/goal/goal.star.webp";
import introTitleUrl from "@/assets/title/title.point.webp";
import startLunarUrl from "@/assets/moon/moon.eclipse.trimmed.webp";
import startMascot1Url from "@/assets/mascot/mascot.happy.frame-01.webp";
import startMascot2Url from "@/assets/mascot/mascot.happy.frame-02.webp";
import clearSparkUrl from "@/assets/star/star.plus.small.color-gold.webp";
import chapterArrowLeftUrl from "@/assets/arrow/arrow.carousel.direction-left.webp";
import chapterArrowRightUrl from "@/assets/arrow/arrow.carousel.direction-right.webp";
import starNodeGoldUrl from "@/assets/star/star.node.color-gold.webp";
import starNodeGrayUrl from "@/assets/star/star.node.color-gray.webp";
import starNodeWhiteUrl from "@/assets/star/star.node.color-white.webp";
import starNodeBlackUrl from "@/assets/star/star.node.color-black.webp";
import backFrameUrl from "@/assets/button/button.back.webp";
import arrowBackUrl from "@/assets/arrow/arrow.back.webp";
import bubbleNextUrl from "@/assets/button/button.bubble.webp";
import decorStarSmallUrl from "@/assets/star/star.cross.small.webp";
import decorStarMediumUrl from "@/assets/star/star.cross.medium.webp";
import decorStarLargeUrl from "@/assets/star/star.cross.large.webp";
import decorMoonUrl from "@/assets/moon/moon.circle.webp";
import decorMascotUrl from "@/assets/mascot/mascot.angle-135.webp";
import { assetUrls } from "./features/presentation";
import { chapters } from "./stages";

export { backgroundUrl, plateButtonUrl, goalStarUrl };

export const introAssets = { title: introTitleUrl } as const;

export const startAssets = {
  lunar: startLunarUrl,
  mascots: [startMascot1Url, startMascot2Url],
} as const;

export const starNodeAssets = {
  gold: starNodeGoldUrl,
  gray: starNodeGrayUrl,
  white: starNodeWhiteUrl,
  black: starNodeBlackUrl,
} as const;

export const clearAssets = { spark: clearSparkUrl, star: starNodeAssets.gold } as const;

export const chapterAssets = {
  arrowLeft: chapterArrowLeftUrl,
  arrowRight: chapterArrowRightUrl,
} as const;

export const stageSelectAssets = {
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
      ...Object.values(starNodeAssets),
      ...Object.values(chapterAssets),
      ...Object.values(stageSelectAssets),
      ...Object.values(decorAssets),
      ...Object.values(assetUrls),
      ...chapters.map((chapter) => chapter.zodiacUrl),
    ]),
  );
}
