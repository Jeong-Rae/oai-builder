import { access, rename } from "node:fs/promises";
import { join, parse, resolve } from "node:path";
import process from "node:process";
import sharp from "sharp";

function usage() {
  return "사용법: npm run asset:trim -- <입력 PNG> [출력 PNG] [--replace] [--force] [--inspect] [--alpha-threshold N]";
}

function defaultOutputPath(inputPath) {
  const source = parse(inputPath);
  return join(source.dir, `${source.name}.trimmed.png`);
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function boundsOfAlpha(data, width, height, channels, alphaThreshold = 0) {
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + channels - 1] <= alphaThreshold) continue;

      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < 0) throw new Error("투명이 아닌 픽셀이 없습니다.");

  return {
    left,
    top,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const positional = [];

  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--alpha-threshold") {
      index += 1;
    } else if (!args[index].startsWith("--")) {
      positional.push(args[index]);
    }
  }

  const [input, output] = positional;

  const replace = args.includes("--replace");
  const force = args.includes("--force");
  const inspect = args.includes("--inspect");

  const thresholdIndex = args.indexOf("--alpha-threshold");
  const alphaThreshold = thresholdIndex >= 0 ? Number(args[thresholdIndex + 1]) : 0;

  if (
    !input ||
    (thresholdIndex >= 0 &&
      (!Number.isInteger(alphaThreshold) || alphaThreshold < 0 || alphaThreshold > 254))
  ) {
    throw new Error(usage());
  }

  if (replace && output) {
    throw new Error("--replace 사용 시 출력 파일을 지정할 수 없습니다.");
  }

  const inputPath = resolve(input);

  // --replace: 원본을 최종 출력으로 사용
  // 일반적인 경우: 지정된 output 또는 .trimmed.png
  const outputPath = resolve(replace ? inputPath : (output ?? defaultOutputPath(inputPath)));

  if (!replace && inputPath === outputPath) {
    throw new Error("원본과 출력 파일 경로는 달라야 합니다.");
  }

  if (!replace && !force && (await fileExists(outputPath))) {
    throw new Error(`출력 파일이 이미 있습니다: ${outputPath} (--force로 덮어쓰기)`);
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const bounds = boundsOfAlpha(data, info.width, info.height, info.channels, alphaThreshold);

  if (inspect) {
    console.log(`원본: ${info.width}×${info.height}px, alpha-threshold=${alphaThreshold}`);
    console.log(
      `경계: left=${bounds.left}, top=${bounds.top}, ` +
        `right=${bounds.left + bounds.width - 1}, ` +
        `bottom=${bounds.top + bounds.height - 1}`,
    );
  }

  if (replace) {
    // 원본 파일을 직접 읽으면서 같은 파일에 쓰지 않도록 임시 파일에 생성
    const source = parse(inputPath);
    const tempPath = join(source.dir, `.${source.name}.${process.pid}.trimmed.tmp.png`);

    try {
      await sharp(inputPath).extract(bounds).png().toFile(tempPath);

      await rename(tempPath, inputPath);
    } catch (error) {
      // 실패 시 임시 파일 정리
      if (await fileExists(tempPath)) {
        try {
          await import("node:fs/promises").then(({ unlink }) => unlink(tempPath));
        } catch {
          // cleanup 실패는 원래 오류를 가리지 않음
        }
      }

      throw error;
    }
  } else {
    await sharp(inputPath).extract(bounds).png().toFile(outputPath);
  }

  console.log(
    `${inputPath} → ${outputPath} ` +
      `(${bounds.width}×${bounds.height}px, ` +
      `left=${bounds.left}, top=${bounds.top})`,
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
