// Data model for the CONTROL Resourcebook.
// Every resource page is generated from this structure.

export type Inline = string | { code: string }
export type Cell = Inline | Inline[] | { copy: string }

export interface Story {
  id: string
  title: string
  desc: string
  ref: string
  state: string
  controls: string[]
}

export interface MetaChip {
  label: string
  code: string
}

export interface TableSection {
  type: 'table'
  title: string
  headers: string[]
  rows: Cell[][]
}

export interface RelationSection {
  type: 'relation'
  title: string
  left: { strong: string; code: string }
  right: { strong: string; code: string }
}

export interface FlowNode {
  kind: 'obj' | 'ctrl'
  text: string
}

export interface FlowSection {
  type: 'flow'
  title: string
  before: FlowNode[]
  after: FlowNode[]
  note?: string
  table?: { headers: string[]; rows: Cell[][] }
}

export interface RefsSection {
  type: 'refs'
  title: string
  items: { label: string; route?: string }[]
}

export interface NoteSection {
  type: 'note'
  text: string
}

export interface PolicySection {
  type: 'policy'
  title: string
  strong: string
  lines: Inline[][]
}

export type Section =
  | TableSection
  | RelationSection
  | FlowSection
  | RefsSection
  | NoteSection
  | PolicySection

export interface Source {
  book: string
  ref: string
}

export interface Resource {
  slug: string
  group: '필드' | '오브젝트'
  navLabel: string
  code: string
  name: string
  lede: string
  meta: MetaChip[]
  hasControlStrip: boolean
  stories: Story[]
  sections: Section[]
  sources: Source[]
  /** 대표 이미지 (헤더). DB의 hero_image_url 컬럼에서 병합된다. */
  heroImageUrl?: string | null
  /** 프리뷰 이미지 (스토리북). DB의 preview_image_url 컬럼에서 병합된다. */
  previewImageUrl?: string | null
}

/** Resource에서 편집 가능한 핵심 필드만 추린 형태. */
export interface ResourceCoreInput {
  slug: string
  group: '필드' | '오브젝트'
  navLabel: string
  code: string
  name: string
  lede: string
  hasControlStrip: boolean
}

export const GROUPS: ('필드' | '오브젝트')[] = ['필드', '오브젝트']

const OWNERSHIP: TableSection = {
  type: 'table',
  title: '소유권',
  headers: ['컨트롤', '참조'],
  rows: [
    ['↑', { code: 'CTRL-UP' }],
    ['↓', { code: 'CTRL-DOWN' }],
    ['←', { code: 'CTRL-LEFT' }],
    ['→', { code: 'CTRL-RIGHT' }],
  ],
}

const CONTROL_REFS: RefsSection['items'] = [
  { label: 'OBJ-NORMAL · 일반 오브젝트', route: 'obj-normal' },
  { label: 'CTRL-UP' },
  { label: 'CTRL-DOWN' },
  { label: 'CTRL-LEFT' },
  { label: 'CTRL-RIGHT' },
]

export const SEED_RESOURCES: Resource[] = [
  {
    slug: 'field-wall',
    group: '필드',
    navLabel: '벽',
    code: 'FIELD-WALL',
    name: '벽',
    lede: '진입을 차단하는 필드.',
    meta: [{ label: 'Key', code: 'field.wall' }],
    hasControlStrip: false,
    stories: [
      { id: 'default', title: '기본', desc: '벽의 기본 리소스 상태.', ref: 'FIELD-WALL', state: 'FIELD-WALL', controls: [] },
      { id: 'collision', title: '충돌', desc: '오브젝트의 이동이 벽에 의해 차단된 경우.', ref: 'OBJECT → FIELD-WALL', state: 'FIELD-WALL / collision', controls: [] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '벽'],
          ['식별자', { code: 'FIELD-WALL' }],
          ['키', { copy: 'field.wall' }],
          ['블록 이미지', ''],
        ],
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [['오브젝트가 벽 방향으로 이동', '진입 차단', '위치 유지']],
      },
      {
        type: 'relation',
        title: '관계',
        left: { strong: '이동하는 오브젝트', code: 'OBJECT' },
        right: { strong: '진입 차단', code: 'block' },
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [['충돌', '', '오브젝트의 이동이 벽에 의해 차단됨']],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['충돌', ''],
        ],
      },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.4 · Turn Resolution · WALL / CLOSED GATE' },
      { book: 'CORE RULEBOOK', ref: 'p.7 · Field Reference · WALL' },
    ],
  },
  {
    slug: 'field-teleport',
    group: '필드',
    navLabel: '텔레포트',
    code: 'FIELD-TELEPORT',
    name: '텔레포트',
    lede: '진입한 오브젝트의 위치를 연결된 텔레포트로 이동시키는 필드.',
    meta: [
      { label: 'Key', code: 'field.teleport' },
      { label: 'Link', code: '1:1' },
    ],
    hasControlStrip: false,
    stories: [
      { id: 'default', title: '기본', desc: '텔레포트의 기본 리소스 상태.', ref: 'FIELD-TELEPORT', state: 'FIELD-TELEPORT', controls: [] },
      { id: 'linked', title: '연결', desc: '두 텔레포트가 1:1로 연결된 상태.', ref: 'FIELD-TELEPORT ↔ FIELD-TELEPORT', state: 'FIELD-TELEPORT / linked 1:1', controls: [] },
      { id: 'enter', title: '진입', desc: '오브젝트가 텔레포트에 진입.', ref: 'OBJECT → FIELD-TELEPORT', state: 'FIELD-TELEPORT / enter', controls: [] },
      { id: 'relocate', title: '이동', desc: '진입한 오브젝트의 위치가 연결된 텔레포트로 변경.', ref: 'FIELD-TELEPORT → FIELD-TELEPORT', state: 'FIELD-TELEPORT / relocate', controls: [] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '텔레포트'],
          ['식별자', { code: 'FIELD-TELEPORT' }],
          ['키', { copy: 'field.teleport' }],
          ['블록 이미지', ''],
          ['연결 방식', { code: '1:1' }],
        ],
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [['오브젝트 진입', '연결된 위치로 이동', '오브젝트 위치 변경']],
      },
      {
        type: 'table',
        title: '관계',
        headers: ['대상', '관계', '결과'],
        rows: [
          ['오브젝트', { code: 'relocate' }, '연결된 텔레포트 위치로 이동'],
          ['텔레포트', { code: 'linked' }, [{ code: '1:1' }, ' 연결']],
        ],
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['진입', '', '오브젝트 진입'],
          ['이동', '', '연결된 위치로 이동'],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['진입', ''],
          ['이동', ''],
          ['연결 관계', ''],
        ],
      },
      {
        type: 'refs',
        title: '참조',
        items: [{ label: 'FIELD-TELEPORT · 연결 텔레포트', route: 'field-teleport' }],
      },
    ],
    sources: [{ book: 'CORE RULEBOOK', ref: 'p.7 · Field Reference · TELEPORT' }],
  },
  {
    slug: 'field-plate',
    group: '필드',
    navLabel: '플레이트',
    code: 'FIELD-PLATE',
    name: '플레이트',
    lede: '일반 오브젝트의 점유에 의해 활성화되는 필드.',
    meta: [
      { label: 'Key', code: 'field.plate' },
      { label: 'Target', code: 'OBJ-NORMAL' },
    ],
    hasControlStrip: false,
    stories: [
      { id: 'default', title: '기본', desc: '플레이트의 기본 리소스 상태.', ref: 'FIELD-PLATE', state: 'FIELD-PLATE', controls: [] },
      { id: 'active', title: '활성', desc: '일반 오브젝트가 플레이트를 점유한 상태.', ref: 'FIELD-PLATE / active', state: 'FIELD-PLATE / active', controls: [] },
      { id: 'activate', title: '활성화', desc: '일반 오브젝트 점유로 active 상태가 성립.', ref: 'OBJ-NORMAL → FIELD-PLATE', state: 'FIELD-PLATE / active', controls: [] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '플레이트'],
          ['식별자', { code: 'FIELD-PLATE' }],
          ['키', { copy: 'field.plate' }],
          ['블록 이미지', ''],
          ['활성화 대상', { code: 'OBJ-NORMAL' }],
        ],
      },
      {
        type: 'table',
        title: '상태',
        headers: ['상태', '키', '조건'],
        rows: [['활성', { code: 'active' }, '일반 오브젝트가 플레이트를 점유']],
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [['일반 오브젝트 점유', '활성화', { code: 'active' }]],
      },
      {
        type: 'relation',
        title: '관계',
        left: { strong: '일반 오브젝트', code: 'OBJ-NORMAL' },
        right: { strong: '플레이트 활성화', code: 'activator' },
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['활성화', '', '활성 상태 성립'],
          ['상태 해제', '', ''],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['활성', ''],
          ['활성화', ''],
          ['상태 해제', ''],
        ],
      },
      {
        type: 'refs',
        title: '참조',
        items: [{ label: 'OBJ-NORMAL · 일반 오브젝트', route: 'obj-normal' }],
      },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.6 · Object Reference · 일반 오브젝트' },
      { book: 'CORE RULEBOOK', ref: 'p.7 · Field Reference · PLATE' },
    ],
  },
  {
    slug: 'field-gate',
    group: '필드',
    navLabel: '게이트',
    code: 'FIELD-GATE',
    name: '게이트',
    lede: '연결된 플레이트의 활성 조건에 따라 통행 상태가 변경되는 필드.',
    meta: [
      { label: 'Key', code: 'field.gate' },
      { label: 'Link', code: 'FIELD-PLATE' },
    ],
    hasControlStrip: false,
    stories: [
      { id: 'open', title: '열림', desc: '연결된 플레이트가 모두 활성인 상태.', ref: 'FIELD-GATE / open', state: 'FIELD-GATE / open', controls: [] },
      { id: 'closed', title: '닫힘', desc: '게이트의 closed 상태.', ref: 'FIELD-GATE / closed', state: 'FIELD-GATE / closed', controls: [] },
      { id: 'single', title: '단일 플레이트 연결', desc: '하나의 플레이트를 개방 조건으로 참조.', ref: 'FIELD-PLATE → FIELD-GATE', state: 'FIELD-GATE / single condition', controls: [] },
      { id: 'multi', title: '다중 플레이트 연결', desc: '여러 플레이트가 하나의 게이트에 연결.', ref: 'FIELD-PLATE[] → FIELD-GATE', state: 'FIELD-GATE / multi condition', controls: [] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '게이트'],
          ['식별자', { code: 'FIELD-GATE' }],
          ['키', { copy: 'field.gate' }],
          ['블록 이미지', ''],
          ['연결 대상', { code: 'FIELD-PLATE' }],
        ],
      },
      {
        type: 'table',
        title: '상태',
        headers: ['상태', '키', '조건'],
        rows: [
          ['열림', { code: 'open' }, '연결된 플레이트가 모두 활성'],
          ['닫힘', { code: 'closed' }, ''],
        ],
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [['연결된 플레이트가 모두 활성', '열림', '통행 가능']],
      },
      {
        type: 'table',
        title: '관계',
        headers: ['대상', '관계', '결과'],
        rows: [[{ code: 'FIELD-PLATE' }, { code: 'condition' }, '게이트의 열림 상태 결정']],
      },
      { type: 'note', text: '하나의 게이트는 여러 플레이트와 연결될 수 있다.' },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['열림', '', { code: 'closed → open' }],
          ['닫힘', '', { code: 'open → closed' }],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          [{ code: 'open' }, ''],
          [{ code: 'closed' }, ''],
          ['열림 전환', ''],
          ['닫힘 전환', ''],
          ['플레이트 연결', ''],
        ],
      },
      {
        type: 'refs',
        title: '참조',
        items: [{ label: 'FIELD-PLATE · 플레이트', route: 'field-plate' }],
      },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.7 · Field Reference · GATE' },
      { book: 'CORE RULEBOOK', ref: 'p.7 · Field Reference · Multi-Plate' },
    ],
  },
  {
    slug: 'obj-player',
    group: '오브젝트',
    navLabel: '플레이어',
    code: 'OBJ-PLAYER',
    name: '플레이어',
    lede: '컨트롤을 소유하고 소유한 방향으로 이동하는 플레이어의 기준점.',
    meta: [
      { label: 'Key', code: 'object.player' },
      { label: 'Move', code: '1 cell' },
    ],
    hasControlStrip: true,
    stories: [
      { id: 'default', title: '기본', desc: '플레이어의 기본 리소스 상태.', ref: 'OBJ-PLAYER', state: 'OBJ-PLAYER', controls: [] },
      { id: 'single', title: '컨트롤 1개', desc: '하나의 컨트롤을 소유.', ref: 'OBJ-PLAYER / 1 Control', state: 'OBJ-PLAYER / 1 Control', controls: ['→'] },
      { id: 'multiple', title: '컨트롤 복수', desc: '여러 컨트롤을 소유.', ref: 'OBJ-PLAYER / Multiple Controls', state: 'OBJ-PLAYER / Multiple Controls', controls: ['↑', '→'] },
      { id: 'move', title: '이동', desc: '소유한 컨트롤 방향으로 1칸 이동.', ref: 'OBJ-PLAYER / Move', state: 'OBJ-PLAYER / Move', controls: ['→'] },
      { id: 'transfer', title: '컨트롤 전달', desc: '사용한 컨트롤의 소유자를 일반 오브젝트로 변경.', ref: 'OBJ-PLAYER → OBJ-NORMAL', state: 'OBJ-PLAYER / Transfer', controls: ['→'] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '플레이어'],
          ['식별자', { code: 'OBJ-PLAYER' }],
          ['키', { copy: 'object.player' }],
          ['블록 이미지', ''],
          ['이동 단위', '1칸'],
        ],
      },
      OWNERSHIP,
      { type: 'note', text: '소유한 컨트롤이 입력되면 해당 방향의 행동 주체가 된다.' },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [
          ['소유한 컨트롤 입력', '이동', '해당 방향으로 1칸 이동'],
          ['이동 방향에 일반 오브젝트 존재', '컨트롤 전달', '사용한 컨트롤의 소유자 변경'],
        ],
      },
      {
        type: 'relation',
        title: '관계',
        left: { strong: '플레이어', code: 'OBJ-PLAYER' },
        right: { strong: '일반 오브젝트 · 컨트롤 전달', code: 'transfer → OBJ-NORMAL' },
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['이동', '', '실제 위치 변경'],
          ['컨트롤 전달', '', '사용한 컨트롤의 소유자 변경'],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['이동', ''],
          ['컨트롤 소유', ''],
          ['컨트롤 전달', ''],
        ],
      },
      { type: 'refs', title: '참조', items: CONTROL_REFS },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.2 · How to Read the Game' },
      { book: 'CORE RULEBOOK', ref: 'p.4 · Turn Resolution' },
      { book: 'CORE RULEBOOK', ref: 'p.5 · Ownership Transfer' },
      { book: 'CORE RULEBOOK', ref: 'p.6 · Object Reference · 플레이어의 기준점' },
    ],
  },
  {
    slug: 'obj-normal',
    group: '오브젝트',
    navLabel: '일반 오브젝트',
    code: 'OBJ-NORMAL',
    name: '일반 오브젝트',
    lede: '컨트롤을 소유하고 소유한 방향으로 이동하며, 다른 일반 오브젝트에게 사용한 컨트롤을 전달하는 오브젝트.',
    meta: [
      { label: 'Key', code: 'object.normal' },
      { label: 'Move', code: '1 cell' },
      { label: 'Controls', code: '0–4' },
    ],
    hasControlStrip: true,
    stories: [
      { id: 'default', title: '기본', desc: '일반 오브젝트의 기본 리소스 상태.', ref: 'OBJ-NORMAL', state: 'OBJ-NORMAL', controls: [] },
      { id: 'empty', title: '컨트롤 없음', desc: '컨트롤 0개를 소유.', ref: 'OBJ-NORMAL / 0 Control', state: 'OBJ-NORMAL / 0 Control', controls: [] },
      { id: 'single', title: '컨트롤 1개', desc: '하나의 컨트롤을 소유.', ref: 'OBJ-NORMAL / 1 Control', state: 'OBJ-NORMAL / 1 Control', controls: ['→'] },
      { id: 'multiple', title: '컨트롤 복수', desc: '여러 컨트롤을 소유.', ref: 'OBJ-NORMAL / Multiple Controls', state: 'OBJ-NORMAL / Multiple Controls', controls: ['↑', '→'] },
      { id: 'all', title: '전체 컨트롤', desc: '네 컨트롤을 모두 소유.', ref: 'OBJ-NORMAL / 4 Controls', state: 'OBJ-NORMAL / 4 Controls', controls: ['↑', '↓', '←', '→'] },
      { id: 'move', title: '이동', desc: '소유한 컨트롤 방향으로 1칸 이동.', ref: 'OBJ-NORMAL / Move', state: 'OBJ-NORMAL / Move', controls: ['→'] },
      { id: 'transfer', title: '컨트롤 전달', desc: '사용한 컨트롤을 다른 일반 오브젝트에게 전달.', ref: 'OBJ-NORMAL → OBJ-NORMAL', state: 'OBJ-NORMAL / Transfer', controls: ['→'] },
      { id: 'receive', title: '컨트롤 수신', desc: '다른 일반 오브젝트로부터 컨트롤 소유권을 획득.', ref: 'OBJ-NORMAL / Receive', state: 'OBJ-NORMAL / Receive', controls: ['→'] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '일반 오브젝트'],
          ['식별자', { code: 'OBJ-NORMAL' }],
          ['키', { copy: 'object.normal' }],
          ['블록 이미지', ''],
          ['이동 단위', '1칸'],
          ['컨트롤 보유량', { code: '0–4' }],
        ],
      },
      OWNERSHIP,
      {
        type: 'note',
        text: '하나의 일반 오브젝트는 여러 컨트롤을 소유할 수 있다. 소유한 컨트롤이 입력되면 해당 방향의 행동 주체가 된다.',
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [
          ['소유한 컨트롤 입력', '이동', '해당 방향으로 1칸 이동'],
          ['이동 방향에 일반 오브젝트 존재', '컨트롤 전달', '사용한 컨트롤의 소유자 변경'],
        ],
      },
      {
        type: 'relation',
        title: '관계',
        left: { strong: '일반 오브젝트', code: 'OBJ-NORMAL' },
        right: { strong: '일반 오브젝트 · 컨트롤 전달', code: 'transfer → OBJ-NORMAL' },
      },
      {
        type: 'flow',
        title: '컨트롤 전달',
        before: [
          { kind: 'obj', text: 'A' },
          { kind: 'ctrl', text: '→' },
          { kind: 'obj', text: 'B' },
        ],
        after: [
          { kind: 'obj', text: 'A' },
          { kind: 'obj', text: 'B' },
          { kind: 'ctrl', text: '→' },
        ],
        table: {
          headers: ['변경', '결과'],
          rows: [
            ['A 위치', '유지'],
            ['B 위치', '유지'],
            [[{ code: '→' }, ' 소유자'], { code: 'A → B' }],
          ],
        },
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['이동', '', '실제 위치 변경'],
          ['컨트롤 전달', '', '사용한 컨트롤의 소유자 변경'],
          ['컨트롤 수신', '', '컨트롤 소유권 획득'],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['이동', ''],
          ['컨트롤 소유', ''],
          ['컨트롤 전달', ''],
          ['컨트롤 수신', ''],
        ],
      },
      { type: 'refs', title: '참조', items: CONTROL_REFS },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.3 · Conservation Law' },
      { book: 'CORE RULEBOOK', ref: 'p.4 · Turn Resolution' },
      { book: 'CORE RULEBOOK', ref: 'p.5 · Ownership Transfer' },
      { book: 'CORE RULEBOOK', ref: 'p.6 · Object Reference · 일반 오브젝트' },
    ],
  },
  {
    slug: 'obj-handoff',
    group: '오브젝트',
    navLabel: '핸드오프 앵커',
    code: 'OBJ-HANDOFF',
    name: '핸드오프 앵커',
    lede: '고정된 위치에서 컨트롤의 소유권을 환승시키는 오브젝트.',
    meta: [{ label: 'Key', code: 'object.handoff' }],
    hasControlStrip: true,
    stories: [
      { id: 'empty', title: '빈 앵커', desc: '컨트롤을 보유하지 않은 상태.', ref: 'OBJ-HANDOFF / Empty', state: 'OBJ-HANDOFF / Empty', controls: [] },
      { id: 'single', title: '컨트롤 1개', desc: '하나의 컨트롤을 보유.', ref: 'OBJ-HANDOFF / 1 Control', state: 'OBJ-HANDOFF / 1 Control', controls: ['→'] },
      { id: 'multiple', title: '컨트롤 복수', desc: '여러 컨트롤을 보유.', ref: 'OBJ-HANDOFF / Multiple Controls', state: 'OBJ-HANDOFF / Multiple Controls', controls: ['↑', '→'] },
      { id: 'receive', title: '컨트롤 수신', desc: '빈 앵커가 전달된 컨트롤을 보유.', ref: 'OBJ-NORMAL → OBJ-HANDOFF', state: 'OBJ-HANDOFF / Receive', controls: ['↑'] },
      { id: 'handoff', title: '환승', desc: '기존 컨트롤 집합을 전달하고 접촉에 사용된 컨트롤을 새로 보유.', ref: 'OBJ-NORMAL ↔ OBJ-HANDOFF', state: 'OBJ-HANDOFF / Handoff', controls: ['↑'] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '핸드오프 앵커'],
          ['식별자', { code: 'OBJ-HANDOFF' }],
          ['키', { copy: 'object.handoff' }],
          ['블록 이미지', ''],
        ],
      },
      OWNERSHIP,
      {
        type: 'table',
        title: '동작',
        headers: ['상태', '조건', '동작', '결과'],
        rows: [
          ['빈 앵커', '컨트롤을 전달받음', '컨트롤 보유', '전달된 컨트롤의 소유자가 앵커로 변경'],
          [
            '컨트롤 보유',
            '일반 오브젝트가 컨트롤을 사용해 접촉',
            '컨트롤 소유권 환승',
            '앵커의 기존 컨트롤 집합을 일반 오브젝트에게 전달하고 접촉에 사용된 컨트롤을 앵커가 소유',
          ],
        ],
      },
      {
        type: 'flow',
        title: '환승 예시',
        before: [
          { kind: 'obj', text: 'BLOCK' },
          { kind: 'ctrl', text: '↑' },
          { kind: 'obj', text: 'ANCHOR' },
          { kind: 'ctrl', text: '→' },
        ],
        after: [
          { kind: 'obj', text: 'BLOCK' },
          { kind: 'ctrl', text: '→' },
          { kind: 'obj', text: 'ANCHOR' },
          { kind: 'ctrl', text: '↑' },
        ],
      },
      {
        type: 'relation',
        title: '관계',
        left: { strong: '핸드오프 앵커', code: 'OBJ-HANDOFF' },
        right: { strong: '일반 오브젝트 · 컨트롤 환승', code: 'handoff → OBJ-NORMAL' },
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [
          ['컨트롤 수신', '', '빈 앵커가 컨트롤을 전달받음'],
          ['환승', '', '기존 컨트롤 집합과 사용 컨트롤의 소유자 변경'],
        ],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['컨트롤 보유', ''],
          ['컨트롤 수신', ''],
          ['환승', ''],
        ],
      },
      { type: 'refs', title: '참조', items: CONTROL_REFS },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.6 · Object Reference · Handoff Anchor' },
      { book: 'CORE RULEBOOK', ref: 'p.8 · Special Object Rules · HANDOFF ANCHOR' },
    ],
  },
  {
    slug: 'obj-swapper',
    group: '오브젝트',
    navLabel: '스와퍼',
    code: 'OBJ-SWAPPER',
    name: '스와퍼',
    lede: '두 오브젝트의 컨트롤 소유 집합 전체를 교환하는 오브젝트.',
    meta: [{ label: 'Key', code: 'object.swapper' }],
    hasControlStrip: true,
    stories: [
      { id: 'default', title: '기본', desc: '스와퍼의 기본 리소스 상태.', ref: 'OBJ-SWAPPER', state: 'OBJ-SWAPPER', controls: [] },
      { id: 'swap', title: '교환', desc: '두 대상의 컨트롤 소유 집합 전체가 서로 교환.', ref: 'OBJECT-A ↔ OBJECT-B', state: 'OBJ-SWAPPER / Swap', controls: ['↑', '←', '↓', '→'] },
      { id: 'empty', title: '빈 집합 포함 교환', desc: '한 대상의 컨트롤 집합이 비어 있는 프리뷰.', ref: 'Swap / Empty Set', state: 'OBJ-SWAPPER / Empty Set', controls: ['→'] },
      { id: 'multiple', title: '복수 컨트롤 교환', desc: '복수 컨트롤 집합을 서로 교환.', ref: 'OBJECT-A[] ↔ OBJECT-B[]', state: 'OBJ-SWAPPER / Multiple Controls', controls: ['↑', '←', '↓', '→'] },
    ],
    sections: [
      {
        type: 'table',
        title: '속성',
        headers: ['속성', '값'],
        rows: [
          ['블록명', '스와퍼'],
          ['식별자', { code: 'OBJ-SWAPPER' }],
          ['키', { copy: 'object.swapper' }],
          ['블록 이미지', ''],
        ],
      },
      {
        type: 'table',
        title: '동작',
        headers: ['조건', '동작', '결과'],
        rows: [['교환 조건 성립', '컨트롤 집합 교환', '두 대상의 컨트롤 소유 집합 전체가 서로 교환']],
      },
      {
        type: 'table',
        title: '관계',
        headers: ['대상', '관계', '결과'],
        rows: [
          ['교환 대상 A', { code: 'swap' }, 'A의 컨트롤 집합을 B에게 전달'],
          ['교환 대상 B', { code: 'swap' }, 'B의 컨트롤 집합을 A에게 전달'],
        ],
      },
      {
        type: 'table',
        title: '소유권 변화',
        headers: ['', 'A', 'B'],
        rows: [
          ['Before', { code: '↑ ←' }, { code: '↓ →' }],
          ['After', { code: '↓ →' }, { code: '↑ ←' }],
        ],
      },
      {
        type: 'table',
        title: '사운드',
        headers: ['이벤트', '키', '조건'],
        rows: [['교환', '', '컨트롤 집합 전체 교환']],
      },
      {
        type: 'table',
        title: '시각 표현',
        headers: ['상태 또는 이벤트', '표현'],
        rows: [
          ['기본', ''],
          ['교환 대상 표시', ''],
          ['컨트롤 집합 교환', ''],
        ],
      },
      {
        type: 'refs',
        title: '참조',
        items: [{ label: 'CTRL-UP' }, { label: 'CTRL-DOWN' }, { label: 'CTRL-LEFT' }, { label: 'CTRL-RIGHT' }],
      },
      {
        type: 'policy',
        title: '규칙 확인 필요',
        strong: '교환 대상 표현이 일치하지 않는다.',
        lines: [
          [
            'Object Reference / Special Object Rules 본문은 ',
            { code: '두 일반 Object' },
            '로 서술하며, Special Object Rules 예시는 ',
            { code: 'YOU ↔ BLOCK' },
            ', Representative Puzzle은 ',
            { code: 'YOU' },
            '와 Plate 위 ',
            { code: 'Block' },
            '의 컨트롤 집합 교환을 사용한다.',
          ],
          ['교환 가능한 오브젝트 범위는 별도 확정이 필요하다.'],
        ],
      },
    ],
    sources: [
      { book: 'CORE RULEBOOK', ref: 'p.6 · Object Reference · Swapper' },
      { book: 'CORE RULEBOOK', ref: 'p.8 · Special Object Rules · SWAPPER' },
      { book: 'CORE RULEBOOK', ref: 'p.9 · Representative Puzzle' },
    ],
  },
]

export interface NavGroup {
  label: '필드' | '오브젝트'
  items: Resource[]
}

/** 리소스 배열로부터 사이드바 네비게이션 그룹을 구성한다. */
export function buildNavGroups(resources: Resource[]): NavGroup[] {
  return GROUPS.map((label) => ({
    label,
    items: resources.filter((r) => r.group === label),
  })).filter((g) => g.items.length > 0)
}

/**
 * 리소스의 "속성" 표에 있는 "블록 이미지" 행을 대표 이미지 URL로 채운다.
 * 편집 UI에서 대표 이미지를 지정하면 표에도 반영되도록 한다.
 */
export function firstSlug(resources: Resource[]): string | undefined {
  return resources[0]?.slug
}
