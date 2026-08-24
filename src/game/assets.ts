import backgroundUrl from "@/assets/background/background.space.webp";
import plateButtonUrl from "@/assets/button/button.plate.webp";
import startTitleUrl from "@/assets/title/title.point.webp";
import startLunarUrl from "@/assets/moon/moon.eclipse.trimmed.webp";
import startMascot1Url from "@/assets/mascot/mascot.happy.frame-01.webp";
import startMascot2Url from "@/assets/mascot/mascot.happy.frame-02.webp";
import startMascot3Url from "@/assets/mascot/mascot.happy.frame-03.webp";
import clearSparkUrl from "@/assets/star/star.plus.small.color-gold.webp";
import titleStarCrossUrl from "@/assets/title/title.star-cross.color-yellow.svg";
import chapterArrowLeftUrl from "@/assets/arrow/arrow.carousel.direction-left.webp";
import chapterArrowRightUrl from "@/assets/arrow/arrow.carousel.direction-right.webp";
import starNodeGoldUrl from "@/assets/star/star.node.color-gold.webp";
import starNodeGrayUrl from "@/assets/star/star.node.color-gray.webp";
import starNodeWhiteUrl from "@/assets/star/star.node.color-white.webp";
import starNodeBlackUrl from "@/assets/star/star.node.color-black.webp";
import backFrameUrl from "@/assets/button/button.back.webp";
import arrowBackUrl from "@/assets/arrow/arrow.back.webp";
import bubbleNextUrl from "@/assets/button/button.bubble.webp";
import iconBackUrl from "@/assets/icon/icon.back.size-96x81.webp";
import iconHintUrl from "@/assets/icon/icon.hint.size-76x96.webp";
import iconResetUrl from "@/assets/icon/icon.reset.size-92x96.webp";
import iconRollbackUrl from "@/assets/icon/icon.rollback.size-96x87.webp";
import decorStarSmallUrl from "@/assets/star/star.cross.small.webp";
import decorStarMediumUrl from "@/assets/star/star.cross.medium.webp";
import decorStarLargeUrl from "@/assets/star/star.cross.large.webp";
import challengeStarStellSmallUrl from "@/assets/star/star.stell.small.color-gold.webp";
import decorMoonUrl from "@/assets/moon/moon.eclipse.trimmed.webp";
import decorMascotUrl from "@/assets/mascot/mascot.angle-135.webp";
import { assetUrls } from "@/src/game/features/presentation";
import { chapters, visibleChapters, type ZodiacSign } from "@/src/game/stages";

export { backgroundUrl, plateButtonUrl };

export const startAssets = {
  title: startTitleUrl,
  lunar: startLunarUrl,
  mascots: [startMascot1Url, startMascot2Url, startMascot3Url],
} as const;

export const starNodeAssets = {
  gold: starNodeGoldUrl,
  gray: starNodeGrayUrl,
  white: starNodeWhiteUrl,
  black: starNodeBlackUrl,
} as const;

export const clearAssets = { spark: clearSparkUrl, star: starNodeAssets.gold } as const;

export const titleAssets = { starCross: titleStarCrossUrl } as const;

export const chapterAssets = {
  arrowLeft: chapterArrowLeftUrl,
  arrowRight: chapterArrowRightUrl,
} as const;

export const challengeDecorAssets = {
  plus: clearSparkUrl,
  stellSmall: challengeStarStellSmallUrl,
} as const;

export const chapterZodiacInactiveAssets: Record<ZodiacSign, string> = {
  ARIES: new URL("@/assets/zodiac/zodiac.aries.state-inactive.webp", import.meta.url).href,
  TAURUS: new URL("@/assets/zodiac/zodiac.taurus.state-inactive.webp", import.meta.url).href,
  GEMINI: new URL("@/assets/zodiac/zodiac.gemini.state-inactive.webp", import.meta.url).href,
  CANCER: new URL("@/assets/zodiac/zodiac.cancer.state-inactive.webp", import.meta.url).href,
  LEO: new URL("@/assets/zodiac/zodiac.leo.state-inactive.webp", import.meta.url).href,
  VIRGO: new URL("@/assets/zodiac/zodiac.virgo.state-inactive.webp", import.meta.url).href,
  LIBRA: new URL("@/assets/zodiac/zodiac.libra.state-inactive.webp", import.meta.url).href,
  SCORPIUS: new URL("@/assets/zodiac/zodiac.scorpio.state-inactive.webp", import.meta.url).href,
  SAGITTARIUS: new URL("@/assets/zodiac/zodiac.sagittarius.state-inactive.webp", import.meta.url)
    .href,
  CAPRICORNUS: new URL("@/assets/zodiac/zodiac.capricorn.state-inactive.webp", import.meta.url)
    .href,
  AQUARIUS: new URL("@/assets/zodiac/zodiac.aquarius.state-inactive.webp", import.meta.url).href,
  PISCES: new URL("@/assets/zodiac/zodiac.pisces.state-inactive.webp", import.meta.url).href,
};

export const stageSelectAssets = {
  backFrame: backFrameUrl,
  arrowBack: arrowBackUrl,
  bubbleNext: bubbleNextUrl,
} as const;

export const gameActionAssets = {
  back: iconBackUrl,
  hint: iconHintUrl,
  reset: iconResetUrl,
  rollback: iconRollbackUrl,
} as const;

export const decorAssets = {
  starSmall: decorStarSmallUrl,
  starMedium: decorStarMediumUrl,
  starLarge: decorStarLargeUrl,
  moon: decorMoonUrl,
  mascot: decorMascotUrl,
} as const;

export function gameAssetUrlGroups(): string[][] {
  const intro = [
    backgroundUrl,
    plateButtonUrl,
    startAssets.title,
    startAssets.lunar,
    ...startAssets.mascots,
    stageSelectAssets.bubbleNext,
    clearAssets.spark,
    decorAssets.starSmall,
    decorAssets.starMedium,
    decorAssets.starLarge,
  ];
  const chapter = [
    ...Object.values(titleAssets),
    ...Object.values(starNodeAssets),
    ...Object.values(chapterAssets),
    ...Object.values(challengeDecorAssets),
    decorAssets.moon,
    decorAssets.mascot,
    ...visibleChapters.flatMap(({ sign, zodiacUrl }) => [
      chapterZodiacInactiveAssets[sign],
      zodiacUrl,
    ]),
  ];
  const prioritized = new Set([...intro, ...chapter]);
  const remaining = [
    ...Object.values(chapterZodiacInactiveAssets),
    ...Object.values(stageSelectAssets),
    ...Object.values(gameActionAssets),
    ...Object.values(assetUrls),
    ...chapters.map((chapter) => chapter.zodiacUrl),
  ].filter((url) => !prioritized.has(url));

  return [intro, chapter, remaining];
}
