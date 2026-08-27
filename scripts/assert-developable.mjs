import { execFileSync } from "node:child_process";
import process from "node:process";

const allowedBranches = new Set(["main", "develop"]);
let branch;

try {
  branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
  }).trim();
} catch {
  console.error("배포가 차단되었습니다: 현재 Git 브랜치를 확인할 수 없습니다.");
  process.exitCode = 1;
}

if (branch === "") {
  console.error(
    "배포가 차단되었습니다: detached HEAD 상태에서는 배포할 수 없습니다. main 또는 develop 브랜치를 사용하세요.",
  );
  process.exitCode = 1;
} else if (branch && !allowedBranches.has(branch)) {
  console.error(
    `배포가 차단되었습니다: "${branch}" 브랜치에서는 배포할 수 없습니다. main 또는 develop 브랜치를 사용하세요.`,
  );
  process.exitCode = 1;
}
