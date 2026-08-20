# Phaser Canvas에서 DOM과 동일한 경험을 만드는 방법

이 문서는 기존 `.vn.ts` DOM Scene을 Phaser Canvas Scene으로 옮길 때 시각적 크기, 위치, 효과, 입력 경험을 보존하기 위한 프로젝트 기준이다. 목표는 구현 방식을 복제하는 것이 아니라 **1980×1080 실제 화면에서 사용자가 같은 장면으로 인식하도록 만드는 것**이다.

## 1. 소스 CSS가 아니라 실제 렌더링 값을 기준으로 한다

DOM의 선언값과 최종 표시값은 다를 수 있다. 이 프로젝트에서는 `.game-chapter__title { font-size: ... }`보다 specificity가 높은 `.game-menu h1 { font-size: 2rem }`이 적용되어 Chapter 제목이 실제로 32px이었다. 선언값 72px을 Phaser에 옮기면 제목이 두 배 이상 커진다.

이식 전에 1980×1080 viewport에서 다음을 측정한다.

```ts
const element = document.querySelector('.target')!;
console.table({
  rect: element.getBoundingClientRect().toJSON(),
  fontSize: getComputedStyle(element).fontSize,
  letterSpacing: getComputedStyle(element).letterSpacing,
  opacity: getComputedStyle(element).opacity,
});
```

- `getBoundingClientRect()`: 최종 위치와 실제 폭·높이
- `getComputedStyle()`: cascade 이후 폰트, 간격, 색, opacity
- 이미지의 실제 폭·높이: CSS가 원본 종횡비를 유지했는지 확인
- 애니메이션 요소: 시작·중간·종료 프레임을 각각 확인

현재 Chapter 제목의 기준값은 32px, 양옆 장식 별은 약 16.3×16px이다.

## 2. 논리 좌표와 화면 좌표를 분리한다

Phaser는 1920×1080 논리 해상도에 `Phaser.Scale.FIT`과 `CENTER_BOTH`를 사용한다. 개발 viewport 1980×1080에서는 배율이 1이고 Canvas 좌우에 30px씩 여백이 생긴다.

```ts
const scale = Math.min(viewportWidth / gameWidth, viewportHeight / gameHeight);
const offsetX = (viewportWidth - gameWidth * scale) / 2;
const offsetY = (viewportHeight - gameHeight * scale) / 2;

const screenX = offsetX + logicalX * scale;
const screenY = offsetY + logicalY * scale;
```

DOM과 비교할 때 Phaser 내부 좌표만 비교하지 말고 위 변환을 거친 화면 좌표를 비교한다. 중앙 정렬, 카드 간격, 화면 바깥쪽 화살표처럼 기준점이 다른 요소는 특히 이 차이를 확인한다.

## 3. 이미지 크기는 종횡비까지 보존한다

DOM에서 `width`만 지정하고 `height: auto`인 이미지를 Phaser에서 `setDisplaySize(width, width)`로 옮기면 이미지가 찌그러진다. 먼저 DOM의 실제 bounding box를 측정하고 폭과 높이를 모두 전달한다.

```ts
star.setDisplaySize(9.6, 9.25);   // small
star.setDisplaySize(11.2, 12.02); // medium
star.setDisplaySize(12.8, 13.64); // large
```

또한 `setDisplaySize()` 뒤에 `setScale(1)`을 호출하면 표시 크기가 아니라 원본 텍스처 크기로 돌아간다.

```ts
const baseScaleX = image.scaleX;
const baseScaleY = image.scaleY;

scene.tweens.add({
  targets: image,
  scaleX: baseScaleX * 1.05,
  scaleY: baseScaleY * 1.05,
  yoyo: true,
});
```

크기 동일성이 중요한 배경 오브젝트에는 scale Tween을 사용하지 않고 alpha만 변경한다.

## 4. 폰트는 preload와 실제 메트릭을 함께 확인한다

폰트 파일은 Text를 만들기 전에 Phaser Loader로 불러온다.

```ts
preload(): void {
  this.load.font('Blrr Pixs', fontUrl, 'truetype');
}
```

Phaser Text와 DOM Text는 같은 `fontSize`에서도 폭과 baseline이 다를 수 있다. 다음 값을 별도로 맞춘다.

- `fontSize`, `fontStyle`, `letterSpacing`
- `setOrigin()`과 DOM baseline 차이
- Text 폭을 기준으로 배치되는 장식 이미지의 gap
- 폰트 로드 실패 시 fallback 폰트로 순간 렌더링되지 않는지

텍스트 주변 장식은 예상 문자열 폭을 계산하지 말고 생성된 Phaser Text의 `getLeftCenter()`, `getRightCenter()`를 기준으로 배치한다.

## 5. CSS 효과는 Canvas에 맞는 효과로 치환한다

| DOM/CSS | Phaser 권장 방식 |
| --- | --- |
| `transition: transform/opacity` | Tween으로 `x`, `scaleX/Y`, `alpha` 동시 변경 |
| `drop-shadow()` | Phaser 4 Glow Filter 또는 반투명 halo 복제 레이어 |
| `z-index` | 모든 주요 그룹에 명시적인 `setDepth()` |
| SVG dashed stroke | `Graphics`에서 dash/gap 구간을 직접 그리기 |
| CSS background cover | 텍스처 크기를 읽고 `Math.max(viewW/srcW, viewH/srcH)`로 scale |

Phaser 4의 Game Object Filter는 먼저 활성화해야 한다.

```ts
image.enableFilters();
image.filters!.external
  .addGlow(0xffd866, 1.2, 0, 1, false, 6, 8)
  .setPaddingOverride(null);
```

Glow는 WebGL 전용이므로 Canvas renderer에서도 보여야 하는 핵심 효과라면 낮은 alpha의 큰 이미지나 굵은 선을 뒤에 하나 더 둔다. 필터와 halo가 동시에 너무 강해지지 않도록 실제 화면에서 확인한다.

## 6. 에셋 Loader는 Vite가 만든 최종 URL 형식을 확인한다

Vite는 작은 SVG를 percent-encoded `data:` URL로 인라인할 수 있다. 이를 Phaser `load.svg()`에 전달하면 Base64로 잘못 해석되어 `atob` 예외가 발생하고 Scene preload가 멈출 수 있다.

```ts
// Vite가 URL로 변환한 SVG는 브라우저 이미지 로더에 맡긴다.
this.load.image('arrow-left', arrowLeftUrl);
```

새 에셋을 추가한 뒤에는 브라우저 콘솔에서 Loader 오류를 확인한다. START 이후 검은 화면은 Scale 문제보다 preload 예외일 가능성을 먼저 점검한다.

## 7. 랜덤 배치는 한 번 생성한 값을 상수로 고정한다

별처럼 무작위로 보여야 하지만 장면을 다시 열 때 위치가 바뀌면 안 되는 요소에는 런타임 `Math.random()`을 사용하지 않는다.

```ts
const backgroundStars = [
  { x: 41.7, y: 12.5 },
  { x: 61.7, y: 51.6 },
  { x: 90.7, y: 62.9 },
] as const;

for (const { x, y } of backgroundStars) {
  scene.add.image(WIDTH * x / 100, HEIGHT * y / 100, texture);
}
```

- 좌표는 한 번 무작위로 뽑은 듯한 상수값으로 기록한다.
- 각 Scene은 별도의 좌표 배열과 Game Object를 가진다.
- 밝기 Tween의 duration과 delay도 index 기반 고정값을 사용한다.
- 크기 비교가 필요한 별은 alpha만 점멸하고 scale은 고정한다.

## 8. Canvas 입력과 접근성은 별도로 구현한다

DOM 버튼이 기본 제공하던 기능은 Canvas 이미지에 자동으로 생기지 않는다.

- 포인터: `setInteractive({ useHandCursor: true })`와 충분한 hit area
- 키보드: 방향키, Enter/Space, Escape를 Scene에서 명시적으로 연결
- 상태: hover, pressed, disabled를 tint/alpha/frame으로 구분
- 중복 입력: Tween 중 추가 이동을 차단
- reduced motion: `prefers-reduced-motion`일 때 Tween duration을 0으로 처리
- 수명주기: `SHUTDOWN`에서 keyboard, store subscription, timer를 해제
- 스크린 리더 지원이 실제 요구사항이면 Canvas만으로 대체하지 말고 동기화된 DOM 컨트롤이나 DOM overlay를 유지

## 9. 완료 기준

DOM→Phaser 이식은 타입 검사만으로 완료하지 않는다. 다음 항목을 모두 확인한다.

1. 1980×1080 동일 viewport에서 DOM과 Phaser 스크린샷을 나란히 비교한다.
2. 제목·이미지·카드의 bounding box와 중심 간 거리를 픽셀로 비교한다.
3. 이미지 종횡비와 `image-rendering: pixelated` 결과를 확인한다.
4. 첫 진입, Scene 재진입, 좌우 이동 후에도 고정 배경 좌표가 유지되는지 확인한다.
5. 브라우저 `pageerror`와 콘솔 Loader 오류가 없는지 확인한다.
6. 일반 모션과 reduced-motion 양쪽을 확인한다.
7. 포인터와 키보드 입력을 모두 확인한다.
8. `npm run typecheck`, `npm run test:run`, `npm run build:live`를 통과시킨다.

핵심 원칙은 간단하다. **CSS 숫자를 복사하지 말고 DOM의 최종 픽셀 결과를 측정한 뒤, Phaser의 좌표·텍스처·Tween 모델로 다시 표현한다.**
