import type { FieldPresentation } from '../../presentationTypes';

const plateUrl = new URL('../../../../../assets/plate/plate.origin.png', import.meta.url).href;

export const platePresentation = {
  kind: 'plate',
  label: '플레이트',
  assets: {
    plateInactive: { label: '플레이트·비활성', url: plateUrl, group: 'field' },
    plateActive: { label: '플레이트·활성', url: plateUrl, group: 'field' },
  },
  toolAsset: 'plateInactive',
  gameTextures: ['plateInactive'],
  editorAsset: (game, positionKey) => game?.plateStates[positionKey] === 'active' ? 'plateActive' : 'plateInactive',
  gameTexture: () => 'plateInactive',
} satisfies FieldPresentation;
