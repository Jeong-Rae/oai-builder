import type { Position, TileKind } from '../game/domain/types';
import type { MapObjectKind } from '../map/mapDocument';
import { createEditorStore, resizeWouldDiscard, type EditorStoreApi, type EditorTool } from './editorStore';

const fieldTools: Array<{ tool: TileKind; label: string; glyph: string }> = [
  { tool: 'floor', label: '바닥', glyph: '·' },
  { tool: 'wall', label: '벽', glyph: '▦' },
  { tool: 'plate', label: '플레이트', glyph: '◎' },
  { tool: 'exit', label: '골', glyph: '◇' },
];

const objectTools: Array<{ tool: MapObjectKind; label: string; glyph: string }> = [
  { tool: 'player', label: '플레이어', glyph: 'P' },
  { tool: 'normal', label: '일반', glyph: 'N' },
  { tool: 'handoff', label: '핸드오프', glyph: 'H' },
  { tool: 'swapper', label: '스와퍼', glyph: 'S' },
];

const objectGlyph: Record<MapObjectKind, string> = {
  player: 'P',
  normal: 'N',
  handoff: 'H',
  swapper: 'S',
};

function toolButton(tool: EditorTool, label: string, glyph: string): string {
  return `<button class="tool" type="button" data-tool="${tool}"><span>${glyph}</span>${label}</button>`;
}

export function mountEditor(root: HTMLElement, store: EditorStoreApi = createEditorStore()): () => void {
  root.innerHTML = `
    <div class="editor-shell">
      <header class="masthead">
        <div>
          <p class="eyebrow">SOKOBAN / MAP LAB</p>
          <h1>퍼즐 설계 도면</h1>
        </div>
        <div class="document-state" data-document-state></div>
      </header>

      <aside class="panel controls-panel" aria-label="맵 편집 도구">
        <section>
          <p class="section-label">보드 크기</p>
          <div class="size-controls">
            <label>열 N<input name="columns" type="number" min="1" value="9" /></label>
            <span>×</span>
            <label>행 M<input name="rows" type="number" min="1" value="9" /></label>
          </div>
          <div class="button-row">
            <button type="button" data-action="resize">크기 적용</button>
            <button type="button" class="quiet" data-action="new">새 맵</button>
          </div>
        </section>

        <section>
          <p class="section-label">필드</p>
          <div class="tool-grid">${fieldTools.map(({ tool, label, glyph }) => toolButton(tool, label, glyph)).join('')}</div>
        </section>

        <section>
          <p class="section-label">오브젝트</p>
          <div class="tool-grid">${objectTools.map(({ tool, label, glyph }) => toolButton(tool, label, glyph)).join('')}</div>
        </section>

        <section>
          <p class="section-label">수정</p>
          <div class="tool-grid">
            ${toolButton('erase', '지우기', '×')}
            ${toolButton('select', '살펴보기', '+')}
          </div>
        </section>
      </aside>

      <section class="board-stage" aria-label="맵 편집 그리드">
        <div class="board-meta"><span data-board-size></span><span data-current-tool></span></div>
        <div class="board-scroll"><div class="map-grid" data-grid></div></div>
        <p class="notice" role="status" data-notice></p>
      </section>

      <aside class="panel inspector-panel">
        <section>
          <p class="section-label">선택한 셀</p>
          <div class="inspector" data-inspector>셀을 선택하세요.</div>
        </section>
        <section>
          <p class="section-label">검증</p>
          <div data-validation></div>
        </section>
        <section class="file-actions">
          <p class="section-label">실행 및 파일</p>
          <button type="button" class="primary" data-action="test">라이브 테스트</button>
          <button type="button" data-action="export">.map 내보내기</button>
          <label class="file-button">.map 불러오기<input type="file" accept=".map" data-map-input /></label>
        </section>
      </aside>
    </div>
    <section class="test-screen" data-test-screen hidden>
      <header><strong>라이브 테스트</strong><div><button type="button" data-action="restart">다시 시작</button><button type="button" data-action="edit">편집으로 돌아가기</button></div></header>
      <div class="game-frame" data-game-host></div>
      <p data-test-status></p>
    </section>
  `;

  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const columnsInput = root.querySelector<HTMLInputElement>('[name="columns"]')!;
  const rowsInput = root.querySelector<HTMLInputElement>('[name="rows"]')!;
  const notice = root.querySelector<HTMLElement>('[data-notice]')!;

  function showNotice(message: string): void {
    notice.textContent = message;
  }

  function positionFrom(target: EventTarget | null): Position | undefined {
    const cell = target instanceof Element ? target.closest<HTMLElement>('[data-cell]') : null;
    if (!cell) return undefined;
    return { x: Number(cell.dataset.x), y: Number(cell.dataset.y) };
  }

  function applyTool(position: Position): void {
    const state = store.getState();
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
      if (state.tool === 'wall' && object && !window.confirm(`${object.id}이 제거됩니다. 벽으로 변경할까요?`)) return;
      state.setTile(position, state.tool as TileKind);
      return;
    }

    if (state.draft.tiles[position.y][position.x] === 'wall') {
      showNotice('벽에는 오브젝트를 배치할 수 없습니다.');
      return;
    }
    state.placeObject(position, state.tool as MapObjectKind);
  }

  function render(): void {
    const state = store.getState();
    const { draft } = state;
    columnsInput.value = String(draft.columns);
    rowsInput.value = String(draft.rows);
    root.querySelector<HTMLElement>('[data-board-size]')!.textContent = `${draft.columns} × ${draft.rows}`;
    root.querySelector<HTMLElement>('[data-current-tool]')!.textContent = `도구 / ${state.tool}`;
    root.querySelector<HTMLElement>('[data-document-state]')!.textContent = state.dirty ? '● 저장되지 않음' : '○ 저장됨';

    root.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.tool === state.tool);
    });

    grid.style.gridTemplateColumns = `2rem repeat(${draft.columns}, var(--cell-size))`;
    const cells = ['<span class="axis corner"></span>'];
    for (let x = 0; x < draft.columns; x += 1) cells.push(`<span class="axis">${x}</span>`);

    for (let y = 0; y < draft.rows; y += 1) {
      cells.push(`<span class="axis">${y}</span>`);
      for (let x = 0; x < draft.columns; x += 1) {
        const object = draft.objects.find((candidate) => candidate.position.x === x && candidate.position.y === y);
        const selected = state.selected?.x === x && state.selected.y === y ? ' selected' : '';
        const field = draft.tiles[y][x];
        const label = object ? `${field}, ${object.kind}` : field;
        cells.push(`<button type="button" class="map-cell field-${field}${selected}" data-cell data-x="${x}" data-y="${y}" aria-label="(${x}, ${y}) ${label}"><span class="field-mark">${field === 'wall' ? '▦' : field === 'plate' ? '◎' : field === 'exit' ? '◇' : '·'}</span>${object ? `<strong class="object object-${object.kind}">${objectGlyph[object.kind]}</strong>` : ''}</button>`);
      }
    }
    grid.innerHTML = cells.join('');

    const inspector = root.querySelector<HTMLElement>('[data-inspector]')!;
    if (!state.selected) {
      inspector.textContent = '셀을 선택하세요.';
    } else {
      const { x, y } = state.selected;
      const object = draft.objects.find((candidate) => candidate.position.x === x && candidate.position.y === y);
      inspector.innerHTML = `<dl><dt>좌표</dt><dd>${x}, ${y}</dd><dt>필드</dt><dd>${draft.tiles[y][x]}</dd><dt>오브젝트</dt><dd>${object ? `${object.kind} / ${object.id}` : '없음'}</dd></dl>`;
    }

    const validation = root.querySelector<HTMLElement>('[data-validation]')!;
    validation.replaceChildren();
    if (state.errors.length === 0) {
      validation.innerHTML = '<p class="valid">● 테스트 가능한 맵</p>';
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

    root.querySelectorAll<HTMLButtonElement>('[data-action="test"], [data-action="export"]').forEach((button) => {
      button.disabled = state.errors.length > 0;
    });
  }

  root.querySelectorAll<HTMLElement>('[data-tool]').forEach((button) => {
    button.addEventListener('click', () => store.getState().setTool(button.dataset.tool as EditorTool));
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

  const unsubscribe = store.subscribe(render);
  render();
  return unsubscribe;
}
