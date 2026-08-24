import { describe, expect, it } from "vite-plus/test";

import { createInitialState } from "@/src/game/domain/level";
import type { Normal } from "@/src/game/domain/types";
import { assetForField, overlayForField, textureForEntity } from "@/src/game/features/presentation";
import { gateOrientationFor, gateVisualFor } from "@/src/game/features/fields/gate/presentation";
import {
  wormholeAsset,
  wormholeAssetSlots,
} from "@/src/game/features/fields/wormhole/presentation";

describe("에디터 에셋 슬롯", () => {
  it("5개 웜홀 이미지 번호를 에셋 슬롯으로 변환한다", () => {
    expect(wormholeAssetSlots).toHaveLength(5);
    expect(wormholeAsset(1)).toBe("wormhole01");
    expect(wormholeAsset(5)).toBe("wormhole05");
  });

  it("라이브 상태에서 웜홀 쌍에 저장된 이미지를 선택한다", () => {
    const game = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 0, y: 0 }, kind: "wormhole" },
        { position: { x: 1, y: 0 }, kind: "wormhole" },
      ],
      wormholePairs: [
        {
          id: 1,
          variant: 5,
          positions: [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
          ],
        },
      ],
    });

    expect(overlayForField("wormhole", game, "0,0")).toBe("wormhole05");
    expect(overlayForField("wormhole", game, "1,0")).toBe("wormhole05");
  });

  it("필드 종류와 상태에 맞는 독립 에셋 슬롯을 선택한다", () => {
    const inactive = createInitialState({ boxCount: 0 });
    const active = { ...inactive, plateStates: { "1,1": "active" as const } };

    expect(assetForField("floor", inactive, "0,0")).toBe("floor");
    expect(assetForField("wall", inactive, "0,0")).toBe("wall");
    expect(assetForField("plate", inactive, "1,1")).toBe("platePawHigh");
    expect(assetForField("plate", active, "1,1")).toBe("platePawLow");
    expect(assetForField("gate", inactive, "0,0")).toBe("gateWarn");
    expect(
      assetForField("gate", { ...inactive, plateStates: { "1,1": "active" as const } }, "0,0"),
    ).toBe("gateSafe");
    expect(assetForField("blank", inactive, "0,0")).toBeUndefined();
  });

  it("플레이 중에는 활성 골을 표시하고 완료 후에는 숨긴다", () => {
    const game = createInitialState({ boxCount: 0 });

    expect(overlayForField("exit", game, "0,0")).toBe("goalActive");
    expect(overlayForField("exit", { ...game, status: "completed" }, "0,0")).toBeUndefined();
  });

  it("노말 블록이 플레이트 위에 있으면 활성 에셋을 표시한다", () => {
    const normal: Normal = {
      id: "normal-1",
      kind: "normal",
      position: { x: 1, y: 1 },
      controls: [],
    };
    const floor = createInitialState({ boxCount: 0 });
    const plate = createInitialState({
      boxCount: 0,
      tileOverrides: [{ position: normal.position, kind: "plate" }],
    });

    expect(textureForEntity(normal, floor)).toBe("normalInactive");
    expect(textureForEntity(normal, plate)).toBe("normalActive");
  });

  it("게이트 상태에 따라 완성형 에셋을 전환한다", () => {
    const inactive = createInitialState({ boxCount: 0 });
    const active = { ...inactive, plateStates: { "1,1": "active" as const } };

    expect(gateVisualFor(inactive)).toBe("gateWarn");
    expect(gateVisualFor(active)).toBe("gateSafe");
  });

  it("게이트 양옆의 길이 방향에 맞춰 레이저를 회전한다", () => {
    const horizontalRoad = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 4, y: 4 }, kind: "gate" },
        { position: { x: 4, y: 3 }, kind: "wall" },
        { position: { x: 4, y: 5 }, kind: "wall" },
      ],
    });
    const verticalRoad = createInitialState({
      boxCount: 0,
      tileOverrides: [
        { position: { x: 4, y: 4 }, kind: "gate" },
        { position: { x: 3, y: 4 }, kind: "wall" },
        { position: { x: 5, y: 4 }, kind: "wall" },
      ],
    });

    expect(gateOrientationFor(horizontalRoad, { x: 4, y: 4 })).toBe("vertical");
    expect(gateOrientationFor(verticalRoad, { x: 4, y: 4 })).toBe("horizontal");
  });
});
