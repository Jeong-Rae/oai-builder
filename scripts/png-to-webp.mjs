import { mkdir, readdir, stat } from "node:fs/promises";
import { extname, join, parse, resolve } from "node:path";
import process from "node:process";
import sharp from "sharp";

function usage() {
  return "사용법: npm run asset:webp -- <입력 PNG 또는 디렉터리> [출력 경로] [--lossy] [--quality N]";
}

function defaultOutputPath(inputPath) {
  const source = parse(inputPath);
  return join(source.dir, `${source.name}.webp`);
}

async function convertFile(inputPath, outputPath, { lossy, quality }) {
  const options = lossy ? { quality } : { lossless: true };
  const info = await sharp(inputPath).webp(options).toFile(outputPath);
  console.log(
    `${inputPath} → ${outputPath} (${lossy ? `손실, quality=${quality}` : "무손실"}, ${info.size} bytes)`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  const positional = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--quality") {
      index += 1;
    } else if (!args[index].startsWith("--")) {
      positional.push(args[index]);
    }
  }
  const [input, output] = positional;
  const qualityIndex = args.indexOf("--quality");
  const lossy = args.includes("--lossy");
  const quality = qualityIndex >= 0 ? Number(args[qualityIndex + 1]) : 80;
  if (!input || !Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error(usage());
  }

  const inputPath = resolve(input);
  const isDirectory = await stat(inputPath).then(
    (s) => s.isDirectory(),
    () => false,
  );

  if (isDirectory) {
    const outputDirPath = resolve(output ?? inputPath);
    await mkdir(outputDirPath, { recursive: true });
    const entries = (await readdir(inputPath)).filter(
      (name) => extname(name).toLowerCase() === ".png",
    );
    if (entries.length === 0) throw new Error(`디렉터리에 PNG 파일이 없습니다: ${inputPath}`);
    for (const name of entries) {
      const source = join(inputPath, name);
      const target = join(outputDirPath, `${parse(name).name}.webp`);
      await convertFile(source, target, { lossy, quality });
    }
    console.log(`${entries.length}개 파일 변환 완료.`);
    return;
  }

  const outputPath = resolve(output ?? defaultOutputPath(inputPath));
  await convertFile(inputPath, outputPath, { lossy, quality });
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
