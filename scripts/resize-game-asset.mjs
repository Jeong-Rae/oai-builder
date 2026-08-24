import { access } from "node:fs/promises";
import { basename, extname, join, parse, resolve } from "node:path";
import process from "node:process";
import sharp from "sharp";
import { assertAssetName } from "./validate-asset-names.mjs";

const SUPPORTED_SIZES = new Set([32, 36, 48, 64, 96]);

function usage() {
  return "사용법: pnpm run asset:resize -- <원본 WebP> <긴 축: 32|36|48|64|96> [--force]";
}

function outputPathFor(sourcePath, width, height) {
  const source = parse(sourcePath);
  const assetName = source.name.replace(/\.size-\d+x\d+$/i, "");
  return join(source.dir, `${assetName}.size-${width}x${height}.webp`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const [input, sizeText, force] = process.argv.slice(2).filter((argument) => argument !== "--");
  const size = Number(sizeText);

  if (!input || !SUPPORTED_SIZES.has(size) || (force && force !== "--force")) {
    throw new Error(usage());
  }

  const inputPath = resolve(input);
  if (extname(inputPath).toLowerCase() !== ".webp") {
    throw new Error("원본 이미지의 확장자는 .webp여야 합니다.");
  }
  const metadata = await sharp(inputPath).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error("원본 이미지 크기를 확인할 수 없습니다.");
  const scale = size / Math.max(metadata.width, metadata.height);
  const width = Math.round(metadata.width * scale);
  const height = Math.round(metadata.height * scale);
  const outputPath = outputPathFor(inputPath, width, height);
  assertAssetName(basename(outputPath));

  if (inputPath === outputPath) {
    throw new Error("원본과 출력 파일 경로는 달라야 합니다.");
  }

  if (force !== "--force" && (await fileExists(outputPath))) {
    throw new Error(`출력 파일이 이미 있습니다: ${basename(outputPath)} (--force로 덮어쓰기)`);
  }

  await sharp(inputPath)
    .resize(width, height, { kernel: sharp.kernel.nearest })
    .webp({ lossless: true })
    .toFile(outputPath);

  console.log(`${inputPath} → ${outputPath} (${width}×${height}px)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
