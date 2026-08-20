import { describe, expect, it } from "vite-plus/test";

import { assetForField, overlayForField } from "../../src/game/features/presentation";
import { createInitialState } from "../../src/game/domain/level";
import { gateVisualFor } from "../../src/game/features/fields/gate/presentation";

describe("에디터 에셋 슬롯", () => {
  it("필드 종류와 상태에 맞는 독립 에셋 슬롯을 선택한다", () => {
    const inactive = createInitialState({ boxCount: 0 });
    const active = { ...inactive, plateStates: { "1,1": "active" as const } };

    expect(assetForField("floor", inactive, "0,0")).toBe("floor");
    expect(assetForField("wall", inactive, "0,0")).toBe("wall");
    expect(assetForField("plate", inactive, "1,1")).toBe("platePawHigh");
    expect(assetForField("plate", active, "1,1")).toBe("platePawLow");
    expect(assetForField("gate", inactive, "0,0")).toBe("gateDeviceWarn");
    expect(
      assetForField("gate", { ...inactive, plateStates: { "1,1": "active" as const } }, "0,0"),
    ).toBe("gateDeviceSafe");
    expect(assetForField("blank", inactive, "0,0")).toBeUndefined();
  });

  it("골은 단일 별 에셋을 표시한다", () => {
    expect(overlayForField("exit", undefined, "0,0")).toBe("goalStar");
  });

  it("열린 게이트는 안전 장치만 표시한다", () => {
    const inactive = createInitialState({ boxCount: 0 });
    const active = { ...inactive, plateStates: { "1,1": "active" as const } };

    expect(gateVisualFor(inactive)).toEqual({ device: "gateDeviceWarn", laser: "gateLaserWarn" });
    expect(gateVisualFor(active)).toEqual({ device: "gateDeviceSafe", laser: undefined });
  });
});
