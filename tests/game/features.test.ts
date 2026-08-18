import { describe, expect, it } from 'vitest';

import {
  assetDefinitions,
  fieldPresentations,
  gameTextureSlots,
  objectPresentations,
} from '../../src/game/features/presentation';
import { fieldKinds, fieldRules, objectKinds, objectRules } from '../../src/game/features/rules';

describe('게임 feature catalog', () => {
  it('모든 필드와 오브젝트의 규칙 및 표현을 함께 등록한다', () => {
    expect(Object.keys(fieldPresentations)).toEqual(fieldKinds);
    expect(Object.keys(objectPresentations)).toEqual(objectKinds);
    expect(Object.keys(fieldRules)).toEqual(fieldKinds);
    expect(Object.keys(objectRules)).toEqual(objectKinds);
  });

  it('도구와 런타임에서 참조하는 모든 에셋 슬롯을 정의한다', () => {
    const referenced = [
      ...Object.values(fieldPresentations).flatMap(({ toolAsset }) => toolAsset ? [toolAsset] : []),
      ...Object.values(objectPresentations).map(({ toolAsset }) => toolAsset),
      ...gameTextureSlots,
    ];

    referenced.forEach((slot) => expect(assetDefinitions[slot]).toBeDefined());
  });
});
