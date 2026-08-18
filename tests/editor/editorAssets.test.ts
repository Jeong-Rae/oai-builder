import { describe, expect, it } from 'vitest';

import { assetForField, goalAsset } from '../../src/editor/editorApp';
import { createInitialState } from '../../src/game/domain/level';

describe('에디터 에셋 슬롯', () => {
  it('필드 종류와 상태에 맞는 독립 에셋 슬롯을 선택한다', () => {
    const inactive = createInitialState({ boxCount: 0 });
    const active = { ...inactive, plateStates: { '1,1': 'active' as const } };

    expect(assetForField('tile', inactive, '0,0')).toBe('tile');
    expect(assetForField('wall', inactive, '0,0')).toBe('wall');
    expect(assetForField('plate', inactive, '1,1')).toBe('plateInactive');
    expect(assetForField('plate', active, '1,1')).toBe('plateActive');
    expect(assetForField('gate', inactive, '0,0')).toBe('gateClosed');
    expect(assetForField('gate', { ...inactive, plateStates: { '1,1': 'active' as const } }, '0,0')).toBe('gateOpen');
    expect(assetForField('blank', inactive, '0,0')).toBeUndefined();
  });

  it('골의 네 프레임을 각각 독립 슬롯으로 선택한다', () => {
    expect([1, 2, 3, 4].map(goalAsset)).toEqual([
      'goalFrame1', 'goalFrame2', 'goalFrame3', 'goalFrame4',
    ]);
  });
});
