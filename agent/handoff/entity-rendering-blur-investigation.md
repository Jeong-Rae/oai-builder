# 게임 오브젝트 렌더링 흐림 조사

## 현상

게임 오브젝트가 처음에는 선명하게 보이지만, 플레이어가 이동하거나 컨트롤이 있는 오브젝트 근처로 이동한 뒤 흐릿하게 보이는 현상을 조사했다.

사용자가 확인한 대표적인 재현 순서는 다음과 같다.

1. 플레이어가 웜홀로 이동한 직후에는 선명하게 보인다.
2. 플레이어가 위쪽으로 한 칸 이동하면 흐릿하게 보인다.
3. 컨트롤을 노멀 오브젝트에 전달하거나 다른 오브젝트 근처로 이동해도 유사한 현상이 나타난다.

이 문서는 2026년 8월 24일까지 수행한 조사와 아직 확정되지 않은 원인 후보를 기록한다.

## 이전 웜홀 문제와의 관계

이전에 `playWormhole()`이 `.entityLayer`에 `translateY()` 애니메이션을 적용하면서 하위 이미지를 비정수 좌표에서 재샘플링하던 문제가 있었다. 당시 조사 내용은 `agent/handoff/wormhole-animation-image-quality.md`에 기록되어 있다.

현재 `playWormhole()`은 실제 오브젝트 레이어에 이동이나 확대 변환을 적용하지 않고 `clip-path`와 `opacity`만 변경한다. 따라서 이번 현상은 과거의 `translateY()` 구현 자체가 다시 발생한 것은 아니다. 다만 비정수 좌표에서 브라우저가 합성된 이미지를 재샘플링할 수 있다는 렌더링 원리는 유사하다.

## 렌더링 구조

`src/game/scenes/game/view.ts`의 `syncEntities()`는 각 오브젝트를 `.entityLayer`에 넣고, 같은 레이어에 방향 컨트롤 이미지도 추가한다.

```text
cell
└─ entityLayer
   ├─ entity
   ├─ control up
   ├─ control down
   ├─ control left
   └─ control right
```

게임판과 오브젝트 크기는 `cqw`와 퍼센트로 계산된다.

- 타일 크기: `5cqw`
- 플레이어 레이어: `inset: 9%`
- 노멀 레이어: `inset: 9% 10%`
- 방향 컨트롤: 레이어 너비와 높이의 `21%`
- 방향 컨트롤 정렬: `transform: translate(-50%, -50%)`

이 계산은 화면 크기에 따라 비정수 CSS 좌표와 크기를 만든다.

## 확인한 비정수 배치

1920×1080, DPR 1 환경에서 다음 값을 측정했다.

| 대상            |          X |          Y |     너비 |     높이 |
| --------------- | ---------: | ---------: | -------: | -------: |
| 플레이어 레이어 |    968.625 |    596.625 |    78.75 |    78.75 |
| 노멀 레이어     |  969.59375 |    500.625 |  76.8125 |    78.75 |
| 플레이어 컨트롤 | 999.734375 | 588.359375 | 16.53125 | 16.53125 |

1366×768, DPR 1 환경에서는 플레이어 레이어가 약 55.98px, 방향 컨트롤이 약 11.75px로 계산되었다.

정수 배치를 강제로 적용한 진단 실험에서는 플레이어 레이어를 78×78px, 방향 컨트롤을 16×16px로 배치할 수 있었다. 그러나 현재 자동화 환경만으로는 사용자가 보고한 큰 화질 차이를 안정적으로 재현하지 못했다. 실제 GPU를 사용하는 사용자 브라우저와 헤드리스 브라우저의 합성 결과가 다를 수 있다.

## `image-rendering` 제거 실험

다음 요소에서 `image-rendering: pixelated`를 제거하고 확인했다.

- `.base`, `.overlay`, `.goal`, `.entity`
- `.stateAssetFill`
- `.control`

타입 검사와 게임 빌드는 통과했지만, 사용자는 화질 문제가 그대로 발생한다고 확인했다. 따라서 `image-rendering: pixelated`는 근본 원인이 아니다. 이 변경은 커밋 전에 원래 상태로 복구했다.

## 컨트롤 전달 전후 비교

노멀 오브젝트에 위쪽 컨트롤을 전달하기 전후를 비교했다.

```text
전달 전
layer: [969.59375, 500.625, 76.8125, 78.75]
controls: []

전달 후
layer: [969.59375, 500.625, 76.8125, 78.75]
controls: ["up"]
```

노멀 오브젝트 중앙 55×55px 영역의 전후 스크린샷을 비교했을 때 변경된 픽셀은 0개였다. 헤드리스 환경에서는 컨트롤 추가가 오브젝트 이미지의 위치, 크기 또는 중앙 픽셀을 변경하지 않았다.

이 결과만으로 실제 GPU 브라우저의 합성 레이어 변경 가능성까지 배제할 수는 없다.

## 실제 브라우저 기록에서 확인된 변화

사용자가 제공한 기록에서는 웜홀 이동 후 선명하던 플레이어가 위쪽으로 이동한 시점에 다음 변화가 나타났다.

| 상태           |          Y | Y 물리 픽셀 소수부 | 크기              | 원본 이미지 크기 | 컨트롤                |
| -------------- | ---------: | -----------------: | ----------------- | ---------------- | --------------------- |
| 이동 전        | 548.890625 |           -0.10938 | 55.96875×55.96875 | 833×1159         | up, down, left, right |
| 이미지 교체 중 | 480.640625 |           -0.35938 | 55.96875×55.96875 | 0×0              | up, down, left, right |
| 이미지 교체 후 | 480.640625 |           -0.35938 | 55.96875×55.96875 | 833×1166         | up, down, left, right |

이 기록에서 다음 사항을 확인했다.

1. 컨트롤 구성은 이동 전후에 동일하므로, 이번 재현에서는 컨트롤 추가나 제거가 직접적인 변화가 아니다.
2. 플레이어의 크기는 변하지 않았다.
3. 플레이어의 Y 좌표가 `68.25px`만큼 이동하면서 물리 픽셀 소수부가 약 `0.25px` 달라졌다.
4. 플레이어 이미지의 원본 크기가 833×1159에서 833×1166으로 바뀌었다.
5. 이미지 교체 도중 `naturalWidth`와 `naturalHeight`가 0인 프레임이 존재했다.
6. 같은 시점에 스와퍼와 노멀 오브젝트의 측정값은 변하지 않았다.

## 플레이어 이미지가 교체되는 코드 경로

플레이어 프레젠테이션의 기본 텍스처는 항상 `playerDown`이다.

```ts
gameTexture: (game) => (game.status === "completed" ? "playerHappy" : "playerDown");
```

키 입력 처리 순서는 다음과 같다.

1. `dispatch()`가 게임 상태를 변경한다.
2. 스토어 구독자가 동기적으로 `view.sync()`를 호출한다.
3. `syncEntities()`가 플레이어 이미지를 기본 `playerDown`으로 지정한다.
4. `dispatch()`가 반환된 뒤 `setPlayerTexture()`가 이동 방향 텍스처를 다시 지정한다.

웜홀을 이용한 이동에서는 `playerTextureForMove()`가 기본 텍스처를 반환한다. 일반적인 위쪽 이동에서는 `playerUp`을 반환한다. 이 차이 때문에 웜홀 직후에는 기존 기본 이미지가 유지되지만, 위쪽 이동에서는 이미지 URL 변경과 디코딩이 발생한다.

`naturalWidth: 0` 기록은 이 이미지 교체 과정이 실제 브라우저 프레임에서 관찰되었다는 증거다.

## 현재 원인 후보

현재 기록만으로 한 가지 원인을 확정할 수는 없다. 우선순위가 높은 후보는 다음과 같다.

### 1. 이동 방향 이미지 교체와 디코딩

이동 순간 플레이어 이미지가 `playerDown`에서 `playerUp`으로 교체된다. 새 이미지가 준비되기 전에 원본 크기가 0인 프레임이 발생하며, 이 과정에서 이미지와 합성 레이어가 다시 래스터화될 수 있다.

### 2. 행마다 달라지는 서브픽셀 위상

타일 높이가 68.25px이므로 위쪽으로 한 칸 이동할 때 플레이어가 다른 물리 픽셀 소수부에 놓인다. 같은 크기의 이미지라도 배치된 행에 따라 브라우저의 재샘플링 결과가 달라질 수 있다.

### 3. 실제 GPU 브라우저의 합성 레이어 변경

방향 컨트롤은 `transform`을 사용하는 자식 요소다. 컨트롤이 포함된 `.entityLayer`가 실제 GPU 환경에서 별도의 합성 레이어로 처리되거나 래스터 캐시가 갱신될 가능성이 있다. 헤드리스 환경에서는 이 현상을 재현하지 못했다.

### 4. 방향별 원본 이미지의 시각적 차이

`playerDown`과 `playerUp`은 크기와 그림 내용이 서로 다른 파일이다. 축소된 화면에서 위 방향 이미지의 넓은 회색 영역과 세부 묘사가 상대적으로 흐릿하게 인식될 가능성도 있다.

## 브라우저 진단 도구

`scripts/browser-entity-render-probe.js`를 Chrome DevTools의 Sources > Snippets에서 실행한다.

진단 도구는 프레임마다 다음 정보를 기록한다.

- CSS 좌표와 크기
- DPR을 반영한 물리 픽셀 좌표와 소수부
- 현재 이미지 URL과 로드 완료 여부
- 원본 이미지 크기
- 컨트롤 소유 상태
- `transform`, `filter`, `opacity`, `clip-path`, `image-rendering`, `will-change`

재현이 끝난 뒤 Console에서 다음 명령을 실행한다.

```js
entityRenderProbe.stop();
```

필요하면 다음 명령으로 수동 표본을 추가한다.

```js
entityRenderProbe.sample("선명");
entityRenderProbe.sample("흐림");
```

컨트롤을 숨겨서 합성 영향이나 시각적 간섭을 비교할 수 있다.

```js
entityRenderProbe.hideControls(true);
entityRenderProbe.hideControls(false);
```

## 다음 분리 실험

### 이미지 교체 분리

선명한 상태에서 현재 플레이어 이미지 URL을 저장한다.

```js
window.testPlayer = document.querySelector('img[alt="플레이어"]');
window.clearPlayerSource = testPlayer.currentSrc;
```

위쪽으로 이동하여 흐려진 뒤 이전 이미지를 다시 지정한다.

```js
window.blurredPlayerSource = testPlayer.currentSrc;
testPlayer.src = clearPlayerSource;
await testPlayer.decode();
```

- 다시 선명해지면 방향 이미지 교체 또는 방향별 원본 이미지가 원인이다.
- 계속 흐리면 위치의 서브픽셀 위상이나 합성 상태가 원인이다.

### 서브픽셀 배치 분리

흐린 상태의 플레이어 레이어 위치와 크기를 물리 픽셀에 맞춘다.

```js
testPlayer.src = blurredPlayerSource;
await testPlayer.decode();

const layer = testPlayer.parentElement;
const cell = layer.parentElement;
const layerRect = layer.getBoundingClientRect();
const cellRect = cell.getBoundingClientRect();
const dpr = devicePixelRatio;
const snap = (value) => Math.round(value * dpr) / dpr;

Object.assign(layer.style, {
  inset: "auto",
  left: `${snap(layerRect.x) - cellRect.x}px`,
  top: `${snap(layerRect.y) - cellRect.y}px`,
  width: `${snap(layerRect.width)}px`,
  height: `${snap(layerRect.height)}px`,
});
```

- 즉시 선명해지면 서브픽셀 배치가 원인이다.
- 변화가 없으면 이미지 교체 또는 GPU 합성 상태를 추가로 확인해야 한다.

### 강제 재도색 분리

레이아웃과 이미지 URL을 유지한 상태에서 플레이어만 다시 그리게 한다.

```js
testPlayer.style.visibility = "hidden";
void testPlayer.offsetWidth;
testPlayer.style.visibility = "";
```

강제 재도색 후 선명해지면 래스터 캐시 또는 합성 레이어 문제가 유력하다.

## 결과에 따른 수정 방향

### 이미지 교체가 원인인 경우

- `syncEntities()`가 플레이어를 항상 `playerDown`으로 되돌린 뒤 다시 방향 이미지를 지정하는 흐름을 제거한다.
- 플레이어의 현재 방향을 뷰 상태 또는 게임 상태에서 한 번만 결정한다.
- 최종 이미지 URL이 달라질 때만 `src`를 변경한다.
- 방향별 이미지를 사전에 디코딩하여 이동 중 `naturalWidth: 0` 상태가 발생하지 않게 한다.

### 서브픽셀 배치가 원인인 경우

- 타일, 게임판 시작점, 오브젝트 레이어와 컨트롤을 `devicePixelRatio` 기준으로 스냅한다.
- `translate(-50%)`를 사용하는 컨트롤은 짝수 물리 픽셀 크기를 사용하거나 최종 `left`와 `top`을 직접 계산한다.
- `ResizeObserver`로 게임 프레임 크기가 변경될 때 공통 CSS 변수를 다시 계산한다.

### GPU 합성이 원인인 경우

- 실제 오브젝트 이미지와 방향 컨트롤을 서로 다른 형제 레이어로 분리한다.
- 실제 오브젝트 레이어에는 `transform`, `filter`, `will-change`를 적용하지 않는다.
- 이동이나 웜홀 효과가 필요하면 별도의 효과 요소만 애니메이션한다.

## 검증 상태

- `image-rendering: pixelated` 제거 실험은 문제를 해결하지 못해서 복구했다.
- 진단 스크립트는 `node --check`를 통과했다.
- 자동 측정에서는 컨트롤 전달 전후 노멀 오브젝트 중앙 픽셀이 동일했다.
- 실제 사용자 브라우저 기록에서는 플레이어 이동 시 이미지 교체와 서브픽셀 위상 변화가 동시에 확인되었다.
- 영구 수정은 아직 적용하지 않았다.
