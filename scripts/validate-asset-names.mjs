import { readdir } from "node:fs/promises";
import { extname, join, parse, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const FACET_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const ATTRIBUTE_PATTERNS = {
  angle: /^angle-\d+$/,
  color: /^color-[a-z]+(?:-[a-z0-9]+)*$/,
  direction: /^direction-[a-z]+(?:-[a-z0-9]+)*$/,
  frame: /^frame-\d{2}$/,
  level: /^level-[a-z]+(?:-[a-z0-9]+)*$/,
  size: /^size-[1-9]\d*x[1-9]\d*$/,
  state: /^state-[a-z]+(?:-[a-z0-9]+)*$/,
};

export function validateAssetName(fileName) {
  const errors = [];

  if (![".webp", ".svg", ".mp3"].includes(extname(fileName))) {
    errors.push("확장자는 .webp, .svg 또는 .mp3여야 합니다.");
  }

  const facets = parse(fileName).name.split(".");
  for (const facet of facets) {
    if (!FACET_PATTERN.test(facet)) {
      errors.push(`잘못된 facet입니다: ${facet}`);
      continue;
    }
    if (facet === "origin") errors.push("origin facet은 사용할 수 없습니다.");

    const attribute = Object.keys(ATTRIBUTE_PATTERNS).find(
      (key) => facet === key || facet.startsWith(`${key}-`),
    );
    if (attribute && !ATTRIBUTE_PATTERNS[attribute].test(facet)) {
      errors.push(`잘못된 ${attribute} 속성입니다: ${facet}`);
    }
  }

  return errors;
}

export function assertAssetName(fileName) {
  const errors = validateAssetName(fileName);
  if (errors.length > 0) throw new Error(`${fileName}: ${errors.join(" ")}`);
}

async function assetFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "fonts") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await assetFiles(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function main() {
  const assetsDirectory = resolve(process.argv[2] ?? "assets");
  const failures = [];

  for (const file of await assetFiles(assetsDirectory)) {
    const errors = validateAssetName(parse(file).base);
    if (errors.length > 0) failures.push([relative(process.cwd(), file), errors]);
  }

  if (failures.length > 0) {
    for (const [file, errors] of failures) {
      console.error(`${file}: ${errors.join(" ")}`);
    }
    throw new Error(`${failures.length}개 에셋의 이름이 규칙에 맞지 않습니다.`);
  }

  console.log("에셋 네이밍 검증을 통과했습니다.");
}

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
