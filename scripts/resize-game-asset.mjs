import { access } from 'node:fs/promises';
import { basename, join, parse, resolve } from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const SOURCE_SIZE = 1254;
const SUPPORTED_SIZES = new Set([32, 36, 48, 64]);

function usage() {
  return '사용법: npm run asset:resize -- <원본 PNG> <32|36|48|64> [--force]';
}

function outputPathFor(sourcePath, size) {
  const source = parse(sourcePath);
  const assetName = source.name.replace(/(?:[._-](?:origin|source|1254))$/i, '');
  return join(source.dir, `${assetName}.${size}.png`);
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
  const [input, sizeText, force] = process.argv.slice(2);
  const size = Number(sizeText);

  if (!input || !SUPPORTED_SIZES.has(size) || (force && force !== '--force')) {
    throw new Error(usage());
  }

  const inputPath = resolve(input);
  const outputPath = outputPathFor(inputPath, size);
  const metadata = await sharp(inputPath).metadata();

  if (metadata.width !== SOURCE_SIZE || metadata.height !== SOURCE_SIZE) {
    throw new Error(`원본 이미지는 ${SOURCE_SIZE}×${SOURCE_SIZE}px여야 합니다.`);
  }

  if (inputPath === outputPath) {
    throw new Error('원본과 출력 파일 경로는 달라야 합니다.');
  }

  if (force !== '--force' && await fileExists(outputPath)) {
    throw new Error(`출력 파일이 이미 있습니다: ${basename(outputPath)} (--force로 덮어쓰기)`);
  }

  const cropSize = SOURCE_SIZE - (SOURCE_SIZE % size);
  const trim = (SOURCE_SIZE - cropSize) / 2;

  await sharp(inputPath)
    .extract({ left: trim, top: trim, width: cropSize, height: cropSize })
    .resize(size, size, { kernel: sharp.kernel.nearest })
    .png()
    .toFile(outputPath);

  console.log(`${inputPath} → ${outputPath} (${size}×${size}px)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
