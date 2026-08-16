import type { Direction, GameState, Position, TileKind } from '../game/domain/types';
import { isGateOpen } from '../game/domain/decider';
import { findPath, type PathResult } from '../game/domain/pathfinder';
import { createGameStateFromMap } from '../game/domain/level';
import { directionFromKey, isUndoShortcut } from '../game/input';
import { playerTextureForMove, playerTextureKeys } from '../game/playerAppearance';
import { createGameStoreFromMap, type GameStoreApi } from '../game/store/gameStore';
import { serializeMap, type MapObjectKind } from '../map/mapDocument';
import { createEditorStore, resizeWouldDiscard, type EditorStoreApi, type EditorTool } from './editorStore';
import { applyLoadedMap, downloadMap, mapFilename, readMapFile } from './mapFiles';

const assetUrls = {
  floor: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  wall: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  plateInactive: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  plateActive: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  wormhole: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  gateClosed: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  gateOpen: new URL('../../assets/tail/tile.96.png', import.meta.url).href,
  normal: new URL('../../assets/box/box.3d.96.png', import.meta.url).href,
  anchor: new URL('../../assets/box/box.3d.96.png', import.meta.url).href,
  swapper: new URL('../../assets/box/box.3d.96.png', import.meta.url).href,
  playerDefault: new URL('../../assets/playable/player_default.96.png', import.meta.url).href,
  playerUp: new URL('../../assets/playable/player_up.96.png', import.meta.url).href,
  playerDown: new URL('../../assets/playable/player_down.96.png', import.meta.url).href,
  playerLeft: new URL('../../assets/playable/player_left.96.png', import.meta.url).href,
  playerRight: new URL('../../assets/playable/player_right.96.png', import.meta.url).href,
  goalFrame1: new URL('../../assets/goal/goal_1f.96.png', import.meta.url).href,
  goalFrame2: new URL('../../assets/goal/goal_2f.96.png', import.meta.url).href,
  goalFrame3: new URL('../../assets/goal/goal_3f.96.png', import.meta.url).href,
  goalFrame4: new URL('../../assets/goal/goal_4f.96.png', import.meta.url).href,
  up: new URL('../../assets/arrow/arrow_up.svg', import.meta.url).href,
  down: new URL('../../assets/arrow/arrow_down.svg', import.meta.url).href,
  left: new URL('../../assets/arrow/arrow_left.svg', import.meta.url).href,
  right: new URL('../../assets/arrow/arrow_right.svg', import.meta.url).href,
};

export type EditorAssetKey = keyof typeof assetUrls;
type AssetKey = EditorAssetKey;

const assetLabels: Record<AssetKey, string> = {
  floor: '바닥',
  wall: '벽',
  plateInactive: '플레이트 · 비활성',
  plateActive: '플레이트 · 활성',
  wormhole: '웜홀',
  gateClosed: '게이트 · 닫힘',
  gateOpen: '게이트 · 열림',
  normal: '일반 오브젝트',
  anchor: '앵커',
  swapper: '스와퍼',
  playerDefault: '플레이어 · 기본',
  playerUp: '플레이어 위 방향',
  playerDown: '플레이어 아래 방향',
  playerLeft: '플레이어 왼쪽 방향',
  playerRight: '플레이어 오른쪽 방향',
  goalFrame1: '골 · 1프레임',
  goalFrame2: '골 · 2프레임',
  goalFrame3: '골 · 3프레임',
  goalFrame4: '골 · 4프레임',
  up: '위 방향 표시',
  down: '아래 방향 표시',
  left: '왼쪽 방향 표시',
  right: '오른쪽 방향 표시',
};

interface ToolOption<T extends EditorTool> {
  tool: T;
  label: string;
  asset?: AssetKey;
  badge?: string;
}

const fieldTools: Array<ToolOption<TileKind>> = [
  { tool: 'blank', label: '맵 외부', badge: '∅' },
  { tool: 'floor', label: '바닥', asset: 'floor' },
  { tool: 'wall', label: '벽', asset: 'wall' },
  { tool: 'plate', label: '플레이트', asset: 'plateInactive' },
  { tool: 'wormhole', label: '웜홀', asset: 'wormhole' },
  { tool: 'gate', label: '게이트', asset: 'gateClosed' },
  { tool: 'exit', label: '골', asset: 'goalFrame1' },
];

const objectTools: Array<ToolOption<MapObjectKind>> = [
  { tool: 'player', label: '플레이어', asset: 'playerDefault' },
  { tool: 'normal', label: '일반', asset: 'normal' },
  { tool: 'anchor', label: '앵커', asset: 'anchor' },
  { tool: 'swapper', label: '스와퍼', asset: 'swapper' },
];

const assetsByTool: Partial<Record<EditorTool, AssetKey>> = {
  floor: 'floor',
  wall: 'wall',
  plate: 'plateInactive',
  wormhole: 'wormhole',
  gate: 'gateClosed',
  exit: 'goalFrame1',
  player: 'playerDefault',
  normal: 'normal',
  anchor: 'anchor',
  swapper: 'swapper',
};

const playerAssetByTexture: Record<string, AssetKey> = {
  [playerTextureKeys.default]: 'playerDefault',
  [playerTextureKeys.up]: 'playerUp',
  [playerTextureKeys.down]: 'playerDown',
  [playerTextureKeys.left]: 'playerLeft',
  [playerTextureKeys.right]: 'playerRight',
};

const assetGroups: Array<{ label: string; keys: AssetKey[] }> = [
  { label: '필드', keys: ['floor', 'wall', 'plateInactive', 'plateActive', 'wormhole', 'gateClosed', 'gateOpen'] },
  { label: '오브젝트', keys: ['playerDefault', 'playerUp', 'playerDown', 'playerLeft', 'playerRight', 'normal', 'anchor', 'swapper'] },
  { label: '골 애니메이션', keys: ['goalFrame1', 'goalFrame2', 'goalFrame3', 'goalFrame4'] },
  { label: '방향 표시', keys: ['up', 'down', 'left', 'right'] },
];

export function assetForField(field: TileKind, game: GameState | undefined, key: string): AssetKey | undefined {
  switch (field) {
    case 'blank': return undefined;
    case 'floor': return 'floor';
    case 'wall': return 'wall';
    case 'plate': return game?.plateStates[key] === 'active' ? 'plateActive' : 'plateInactive';
    case 'wormhole': return 'wormhole';
    case 'gate': return game && isGateOpen(game) ? 'gateOpen' : 'gateClosed';
    case 'exit': return undefined;
  }
}

export function goalAsset(frame: number): AssetKey {
  return `goalFrame${frame}` as AssetKey;
}

const rejectionMessages = {
  'out-of-bounds': '보드 밖으로 이동할 수 없습니다.',
  wall: '벽으로 이동할 수 없습니다.',
  fixed: '고정 오브젝트는 직접 이동할 수 없습니다.',
  occupied: '반대편 웜홀 위치가 점유되어 있습니다.',
};

const directionSymbols: Record<Direction, string> = { up: '↑', down: '↓', left: '←', right: '→' };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  })[character]!);
}

function cloneTemplate(id: string): DocumentFragment {
  const template = document.getElementById(id) as HTMLTemplateElement | null;
  if (!template) throw new Error(`${id} 템플릿을 찾을 수 없습니다.`);
  return template.content.cloneNode(true) as DocumentFragment;
}

function toolButton({ tool, label, asset, badge }: ToolOption<EditorTool>, resolveAsset: (key: AssetKey) => string): HTMLButtonElement {
  const fragment = cloneTemplate('editor-tool-template');
  const button = fragment.querySelector<HTMLButtonElement>('.tool')!;
  const visual = fragment.querySelector<HTMLElement>('[data-asset-visual]')!;
  const symbol = fragment.querySelector<HTMLElement>('[data-symbol]')!;

  button.dataset.tool = tool;
  fragment.querySelector<HTMLElement>('[data-label]')!.textContent = label;
  visual.hidden = !asset;
  symbol.hidden = Boolean(asset);
  symbol.textContent = badge ?? '';

  if (asset) {
    visual.classList.add(`preview-${tool}`);
    const image = fragment.querySelector<HTMLImageElement>('[data-tool-image]')!;
    image.dataset.assetKey = asset;
    image.src = resolveAsset(asset);
    fragment.querySelector<HTMLElement>('[data-tool-badge]')!.textContent = badge ?? '';
  }

  return button;
}

export function mountEditor(root: HTMLElement, store: EditorStoreApi = createEditorStore()): () => void {
  let localAssets: Partial<Record<AssetKey, string>> = {};
  let selectedAsset: AssetKey = assetsByTool.floor!;
  const resolveAsset = (key: AssetKey): string => localAssets[key] ?? assetUrls[key];
  const playerAssetPreloads = Object.values(playerAssetByTexture).map((key) => {
    const image = new Image();
    image.src = resolveAsset(key);
    return image;
  });
  const playerAssetsReady = Promise.all(playerAssetPreloads.map(async (image) => {
    await image.decode();
    return image;
  }));

  root.replaceChildren(cloneTemplate('editor-shell-template'));
  root.querySelector<HTMLElement>('[data-field-tools]')!.append(...fieldTools.map((tool) => toolButton(tool, resolveAsset)));
  root.querySelector<HTMLElement>('[data-object-tools]')!.append(...objectTools.map((tool) => toolButton(tool, resolveAsset)));
  root.querySelector<HTMLElement>('[data-edit-tools]')!.append(
    toolButton({ tool: 'erase', label: '지우기', badge: '×' }, resolveAsset),
    toolButton({ tool: 'select', label: '살펴보기', badge: '+' }, resolveAsset),
  );

  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const board = root.querySelector<HTMLElement>('.board-scroll')!;
  const columnsInput = root.querySelector<HTMLInputElement>('[name="columns"]')!;
  const rowsInput = root.querySelector<HTMLInputElement>('[name="rows"]')!;
  const notice = root.querySelector<HTMLElement>('[data-notice]')!;
  const assetSelect = root.querySelector<HTMLSelectElement>('[data-asset-select]')!;
  assetGroups.forEach(({ label, keys }) => {
    const group = document.createElement('optgroup');
    group.label = label;
    keys.forEach((key) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = assetLabels[key];
      group.append(option);
    });
    assetSelect.append(group);
  });
  assetSelect.value = selectedAsset;
  let testStore: GameStoreApi | undefined;
  let unsubscribeTest: (() => void) | undefined;
  let testMoved = false;
  let playerAsset: AssetKey = 'playerDefault';
  let goalFrame = 1;
  let goalAnimationTimer: number | undefined;
  let pathResult: PathResult | undefined;
  const pathCache = new Map<string, PathResult | null>();
  let playbackRun = 0;
  let playbackActive = false;

  function showNotice(message: string): void {
    notice.textContent = message;
  }

  function stopTest(): void {
    playbackRun += 1;
    playbackActive = false;
    unsubscribeTest?.();
    unsubscribeTest = undefined;
    testStore = undefined;
    testMoved = false;
    playerAsset = 'playerDefault';
    goalFrame = 1;
    if (goalAnimationTimer !== undefined) window.clearTimeout(goalAnimationTimer);
    goalAnimationTimer = undefined;
  }

  function playGoalAnimation(): void {
    if (goalAnimationTimer !== undefined) window.clearTimeout(goalAnimationTimer);
    goalFrame = 1;
    const nextFrame = (): void => {
      if (goalFrame >= 4) {
        goalAnimationTimer = undefined;
        return;
      }
      goalAnimationTimer = window.setTimeout(() => {
        goalFrame += 1;
        render();
        nextFrame();
      }, 180);
    };
    nextFrame();
  }

  function createTestState(clearPath = true): void {
    stopTest();
    if (clearPath) pathResult = undefined;
    const state = store.getState();
    if (state.errors.length > 0) return;
    testStore = createGameStoreFromMap(state.draft);
    unsubscribeTest = testStore.subscribe((state, previous) => {
      testMoved = state.eventStream.length > 0;
      if (!previous.game.goalOpened && state.game.goalOpened) playGoalAnimation();
    });
  }

  function positionFrom(target: EventTarget | null): Position | undefined {
    const cell = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null;
    if (!cell) return undefined;
    return { x: Number(cell.dataset.x), y: Number(cell.dataset.y) };
  }

  function applyTool(position: Position): void {
    let state = store.getState();
    if (testMoved && state.tool !== 'select') {
      createTestState();
      state = store.getState();
    }

    const object = state.draft.objects.find((candidate) =>
      candidate.position.x === position.x && candidate.position.y === position.y,
    );
    state.select(position);

    if (state.tool === 'select') return;
    if (state.tool === 'erase') {
      state.erase(position);
      return;
    }
    if (fieldTools.some(({ tool }) => tool === state.tool)) {
      if ((state.tool === 'wall' || state.tool === 'blank') && object && !window.confirm(`${object.id}이 제거됩니다. 필드를 변경할까요?`)) return;
      if (!state.setTile(position, state.tool as TileKind)) {
        showNotice('웜홀은 두 개까지만 배치할 수 있습니다.');
      }
      return;
    }

    if (['wall', 'blank'].includes(state.draft.tiles[position.y][position.x])) {
      showNotice('벽 또는 맵 외부 영역에는 오브젝트를 배치할 수 없습니다.');
      return;
    }
    state.placeObject(position, state.tool as MapObjectKind);
  }

  function render(): void {
    const state = store.getState();
    const { draft } = state;
    const game = testStore?.getState().game;
    const visibleObjects = game
      ? Object.values(game.entities)
      : draft.objects.map((object) => ({ ...object, controls: [] as Direction[] }));
    const player = visibleObjects.find((object) => object.kind === 'player');
    const retainedPlayer = grid.querySelector<HTMLElement>('.object-player');
    const objectsByPosition = new Map(visibleObjects.map((object) => [
      `${object.position.x},${object.position.y}`,
      object,
    ]));
    const pathOverlay = new Map<string, string[]>();
    const addPathOverlay = (position: Position, content: string) => {
      const key = `${position.x},${position.y}`;
      pathOverlay.set(key, [...(pathOverlay.get(key) ?? []), content]);
    };
    pathResult?.steps.forEach((step) => step.moves.forEach((move) => {
      addPathOverlay(move.from, `<span class="path-arrow" title="${move.step}회 ${directionSymbols[step.direction]}">${directionSymbols[step.direction]}</span>`);
      if (move.wormhole) addPathOverlay(move.wormhole, '<span class="path-wormhole" title="웜홀 이동">↝</span>');
      addPathOverlay(move.to, `<span class="path-step" title="${move.step}회">${move.step}</span>`);
    }));
    columnsInput.value = String(draft.columns);
    rowsInput.value = String(draft.rows);
    root.querySelector<HTMLElement>('[data-board-size]')!.textContent = `${draft.columns} × ${draft.rows}`;
    root.querySelector<HTMLElement>('[data-current-tool]')!.textContent = `도구 / ${state.tool}`;
    root.querySelector<HTMLElement>('[data-document-state]')!.textContent = state.dirty ? '● 저장되지 않음' : '○ 저장됨';

    const liveState = root.querySelector<HTMLElement>('[data-live-state]')!;
    liveState.classList.toggle('ready', Boolean(game));
    liveState.textContent = !game
      ? '플레이어와 골을 배치하세요'
      : game.status === 'completed'
        ? '● 완료 · 배치 상태로 되돌릴 수 있습니다'
        : testMoved ? '● 테스트 중 · 편집하면 즉시 재시작됩니다' : '● 방향키 즉시 테스트';

    root.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === state.tool);
    });
    root.querySelectorAll<HTMLImageElement>('[data-asset-key]').forEach((image) => {
      image.src = resolveAsset(image.dataset.assetKey as AssetKey);
    });
    const appliedAssets = Object.keys(localAssets).map((key) => assetLabels[key as AssetKey]);
    const assetTarget = root.querySelector<HTMLElement>('[data-asset-target]')!;
    assetSelect.value = selectedAsset;
    assetTarget.replaceChildren();
    const preview = document.createElement('img');
    preview.src = resolveAsset(selectedAsset);
    preview.alt = '';
    const previewLabel = document.createElement('span');
    const previewTitle = document.createElement('b');
    previewTitle.textContent = assetLabels[selectedAsset];
    const previewHint = document.createElement('small');
    previewHint.textContent = localAssets[selectedAsset] ? '로컬 교체 이미지 적용 중' : '기본 런타임 이미지';
    previewLabel.append(previewTitle, previewHint);
    assetTarget.append(preview, previewLabel);
    const assetInput = root.querySelector<HTMLInputElement>('[data-asset-input]')!;
    assetInput.disabled = false;
    root.querySelector<HTMLElement>('[data-asset-input-label]')!.classList.remove('disabled');
    root.querySelector<HTMLElement>('[data-asset-status]')!.textContent = appliedAssets.length === 0
      ? '브라우저에서만 적용되며 새로고침하면 사라집니다.'
      : `${appliedAssets.join(', ')} 적용 중 · 서버와 .map에는 저장되지 않습니다.`;

    grid.style.gridTemplateColumns = `2rem repeat(${draft.columns}, var(--cell-size))`;
    const cells = ['<span class="axis corner"></span>'];
    for (let x = 0; x < draft.columns; x += 1) cells.push(`<span class="axis">${x}</span>`);

    for (let y = 0; y < draft.rows; y += 1) {
      cells.push(`<span class="axis">${y}</span>`);
      for (let x = 0; x < draft.columns; x += 1) {
        const key = `${x},${y}`;
        const object = objectsByPosition.get(key);
        const selected = state.selected?.x === x && state.selected.y === y ? ' selected' : '';
        const field = draft.tiles[y][x];
        const label = object ? `${field}, ${object.kind}` : field;
        const goal = field === 'exit'
          ? `<img class="goal-asset" src="${resolveAsset(goalAsset(game?.goalOpened ? goalFrame : 1))}" alt="" />`
          : '';
        const objectAsset = object && !(object.kind === 'player' && retainedPlayer)
          ? `<span class="object-asset object-${object.kind}"><img src="${resolveAsset(object.kind === 'player' ? playerAsset : object.kind)}" alt="" /></span>`
          : '';
        const controls = object?.controls.map((direction) =>
          `<img class="control-asset control-${direction}" src="${resolveAsset(direction)}" alt="${direction}" />`,
        ).join('') ?? '';
        const asset = assetForField(field, game, key);
        const tileAsset = asset ? `<img class="tile-asset" src="${resolveAsset(asset)}" alt="" />` : '';
        const overlay = pathOverlay.get(key)?.join('') ?? '';
        cells.push(`<button type="button" class="map-cell field-${field}${selected}" data-cell data-x="${x}" data-y="${y}" aria-label="(${x}, ${y}) ${label}">${tileAsset}${goal}${objectAsset}<span class="path-overlay">${overlay}</span><span class="control-assets">${controls}</span></button>`);
      }
    }
    retainedPlayer?.remove();
    grid.innerHTML = cells.join('');
    if (retainedPlayer && player) {
      retainedPlayer.querySelector('img')!.src = resolveAsset(playerAsset);
      grid.querySelector<HTMLElement>(`[data-cell][data-x="${player.position.x}"][data-y="${player.position.y}"]`)?.append(retainedPlayer);
    }

    const inspector = root.querySelector<HTMLElement>('[data-inspector]')!;
    if (!state.selected) {
      inspector.textContent = '셀을 선택하세요.';
    } else {
      const { x, y } = state.selected;
      const object = objectsByPosition.get(`${x},${y}`);
      inspector.innerHTML = `<dl><dt>좌표</dt><dd>${x}, ${y}</dd><dt>필드</dt><dd>${draft.tiles[y][x]}</dd><dt>오브젝트</dt><dd>${object ? `${object.kind} / ${escapeHtml(object.id)}` : '없음'}</dd></dl>`;
    }

    const validation = root.querySelector<HTMLElement>('[data-validation]')!;
    validation.replaceChildren();
    if (state.errors.length === 0) {
      validation.innerHTML = '<p class="valid">● 준비됨 · 이 화면에서 방향키를 누르세요.</p>';
    } else {
      const list = document.createElement('ul');
      list.className = 'error-list';
      state.errors.forEach((error) => {
        const item = document.createElement('li');
        item.textContent = error.position ? `${error.message} (${error.position.x}, ${error.position.y})` : error.message;
        list.append(item);
      });
      validation.append(list);
    }

    root.querySelector<HTMLButtonElement>('[data-action="restart"]')!.disabled = !game;
    root.querySelector<HTMLButtonElement>('[data-action="export"]')!.disabled = state.errors.length > 0;
    const findPathButton = root.querySelector<HTMLButtonElement>('[data-action="find-path"]')!;
    findPathButton.disabled = state.errors.length > 0;
    root.querySelector<HTMLButtonElement>('[data-action="play-path"]')!.disabled = !pathResult || playbackActive;
    const pathOutput = root.querySelector<HTMLElement>('[data-path-result]')!;
    pathOutput.textContent = pathResult
      ? `${pathResult.steps.length}회 · ${pathResult.steps.map((step) => directionSymbols[step.direction]).join(' ')}${playbackActive ? ' · 재생 중' : ''}`
      : '';
  }

  async function applyTestMove(direction: Direction): Promise<boolean> {
    await playerAssetsReady;
    if (!testStore) return false;
    const game = testStore.getState().game;
    const decision = testStore.getState().dispatch({ type: 'player/move', direction });
    playerAsset = playerAssetByTexture[playerTextureForMove(game, direction, decision)];
    render();
    if (decision.rejectedBy) showNotice(rejectionMessages[decision.rejectedBy]);
    return !decision.rejectedBy;
  }

  async function handleKeyDown(event: KeyboardEvent): Promise<void> {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
    if (isUndoShortcut(event) && testStore) {
      event.preventDefault();
      if (testStore.getState().undo()) {
        playerAsset = 'playerDefault';
        render();
        showNotice('최근 테스트 이동을 되돌렸습니다.');
      } else {
        showNotice('되돌릴 테스트 이동이 없습니다.');
      }
      return;
    }

    const direction = directionFromKey(event.key);
    if (!direction || !testStore) return;

    event.preventDefault();
    playbackRun += 1;
    playbackActive = false;
    if (await applyTestMove(direction)) showNotice('테스트 상태만 이동했습니다. 맵 배치는 그대로 유지됩니다.');
  }

  root.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const tool = button.dataset.tool as EditorTool;
      selectedAsset = assetsByTool[tool] ?? selectedAsset;
      store.getState().setTool(tool);
    });
  });

  assetSelect.addEventListener('change', () => {
    selectedAsset = assetSelect.value as AssetKey;
    render();
  });

  grid.addEventListener('pointerdown', (event) => {
    const position = positionFrom(event.target);
    if (position) applyTool(position);
  });
  grid.addEventListener('pointerover', (event) => {
    const position = positionFrom(event.target);
    const tool = store.getState().tool;
    if (position && event.buttons === 1 && (fieldTools.some(({ tool: field }) => field === tool) || tool === 'erase')) {
      applyTool(position);
    }
  });
  board.addEventListener('pointerdown', () => board.focus());
  window.addEventListener('keydown', handleKeyDown);

  root.querySelector('[data-action="resize"]')!.addEventListener('click', () => {
    const columns = columnsInput.valueAsNumber;
    const rows = rowsInput.valueAsNumber;
    if (!Number.isInteger(columns) || columns < 1 || !Number.isInteger(rows) || rows < 1) {
      showNotice('열과 행은 1 이상의 정수여야 합니다.');
      return;
    }
    const state = store.getState();
    if (resizeWouldDiscard(state.draft, columns, rows) && !window.confirm('범위 밖의 필드와 오브젝트가 제거됩니다. 계속할까요?')) return;
    state.resize(columns, rows);
    showNotice('보드 크기를 변경했습니다.');
  });

  root.querySelector('[data-action="new"]')!.addEventListener('click', () => {
    const state = store.getState();
    if (state.dirty && !window.confirm('저장하지 않은 맵을 지우고 새 맵을 만들까요?')) return;
    state.newMap(columnsInput.valueAsNumber, rowsInput.valueAsNumber);
    showNotice('새 맵을 만들었습니다. 플레이어와 골을 배치하세요.');
  });

  root.querySelector('[data-action="clear-fields"]')!.addEventListener('click', () => {
    if (!window.confirm('모든 필드를 바닥으로 되돌릴까요? 골도 삭제됩니다.')) return;
    store.getState().clearFields();
    showNotice('모든 필드를 바닥으로 되돌렸습니다.');
  });

  root.querySelector('[data-action="clear-objects"]')!.addEventListener('click', () => {
    if (!window.confirm('배치된 모든 오브젝트를 삭제할까요?')) return;
    store.getState().clearObjects();
    showNotice('모든 오브젝트를 삭제했습니다.');
  });

  root.querySelector('[data-action="reset-map"]')!.addEventListener('click', () => {
    if (!window.confirm('현재 크기를 유지하고 필드와 오브젝트를 모두 초기화할까요?')) return;
    store.getState().resetMap();
    showNotice('맵을 초기화했습니다.');
  });

  root.querySelector('[data-action="restart"]')!.addEventListener('click', () => {
    createTestState();
    render();
    showNotice('현재 맵 초안의 배치 상태로 되돌렸습니다.');
    board.focus();
  });

  root.querySelector('[data-action="find-path"]')!.addEventListener('click', () => {
    const state = store.getState();
    if (state.errors.length > 0) return;
    const mapKey = serializeMap(state.draft);
    const cached = pathCache.get(mapKey);
    pathResult = cached === undefined
      ? findPath(createGameStateFromMap(state.draft))
      : cached ?? undefined;
    if (cached === undefined) pathCache.set(mapKey, pathResult ?? null);
    render();
    showNotice(pathResult ? `최소 ${pathResult.steps.length}회 경로를 표시했습니다.` : '골에 도달하는 경로가 없습니다.');
  });

  root.querySelector('[data-action="play-path"]')!.addEventListener('click', async () => {
    if (!pathResult || playbackActive) return;
    createTestState(false);
    const run = ++playbackRun;
    playbackActive = true;
    render();

    for (const step of pathResult.steps) {
      if (run !== playbackRun || !(await applyTestMove(step.direction))) break;
      await new Promise<void>((resolve) => window.setTimeout(resolve, 280));
    }

    if (run === playbackRun) {
      playbackActive = false;
      render();
      showNotice('최소 경로 재생을 완료했습니다.');
    }
  });

  root.querySelector('[data-action="export"]')!.addEventListener('click', () => {
    const state = store.getState();
    if (state.errors.length > 0) return;
    const suggested = `map-${state.draft.columns}x${state.draft.rows}.map`;
    const name = window.prompt('내보낼 파일 이름', suggested);
    if (name === null) return;
    downloadMap(state.draft, mapFilename(name));
    state.markSaved();
    showNotice(`${mapFilename(name)} 파일을 내보냈습니다.`);
  });

  const mapInput = root.querySelector<HTMLInputElement>('[data-map-input]')!;
  mapInput.addEventListener('change', async () => {
    const file = mapInput.files?.[0];
    mapInput.value = '';
    if (!file) return;

    const result = await readMapFile(file);
    if (!result.ok) {
      showNotice(result.errors.map((error) => error.position
        ? `${error.message} (${error.position.x}, ${error.position.y})`
        : error.message).join(' / '));
      return;
    }

    if (store.getState().dirty && !window.confirm('저장하지 않은 맵을 교체하고 파일을 불러올까요?')) return;
    applyLoadedMap(store, result);
    showNotice(`${file.name} 파일을 불러왔습니다.`);
  });

  const assetInput = root.querySelector<HTMLInputElement>('[data-asset-input]')!;
  assetInput.addEventListener('change', () => {
    const file = assetInput.files?.[0];
    assetInput.value = '';
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      showNotice('이미지 파일만 적용할 수 있습니다.');
      return;
    }

    if (!selectedAsset) return;
    const key = selectedAsset;
    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const previousUrl = localAssets[key];
      localAssets[key] = nextUrl;
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      render();
      showNotice(`${assetLabels[key]}에 ${file.name}을 적용했습니다.`);
    };
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl);
      showNotice('이미지를 읽을 수 없습니다. 다른 파일을 선택하세요.');
    };
    image.src = nextUrl;
  });

  root.querySelector('[data-action="reset-assets"]')!.addEventListener('click', () => {
    Object.values(localAssets).forEach((url) => URL.revokeObjectURL(url));
    localAssets = {};
    render();
    showNotice('기본 에셋으로 복원했습니다.');
  });

  root.querySelector('[data-action="reset-asset"]')!.addEventListener('click', () => {
    const previousUrl = localAssets[selectedAsset];
    if (!previousUrl) return showNotice(`${assetLabels[selectedAsset]}은 이미 기본 이미지입니다.`);
    URL.revokeObjectURL(previousUrl);
    delete localAssets[selectedAsset];
    render();
    showNotice(`${assetLabels[selectedAsset]}을 기본 이미지로 복원했습니다.`);
  });

  const unsubscribeEditor = store.subscribe((state, previous) => {
    if (state.draft !== previous.draft) createTestState();
    render();
  });
  createTestState();
  render();

  return () => {
    unsubscribeEditor();
    stopTest();
    Object.values(localAssets).forEach((url) => URL.revokeObjectURL(url));
    window.removeEventListener('keydown', handleKeyDown);
  };
}
