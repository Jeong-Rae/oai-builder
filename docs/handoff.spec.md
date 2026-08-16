# 핸드오프 앵커

`OBJ-HANDOFF` · 오브젝트

고정된 위치에서 컨트롤을 보유하고 환승시키는 오브젝트.

## 기본 정보

| 항목 | 값 |
|---|---|
| 블록명 | 핸드오프 앵커 |
| 식별자 | `OBJ-HANDOFF` |
| 키 | `object.handoff` |
| 블록 이미지 | <!-- 작성 --> |

## 소유권

핸드오프 앵커는 컨트롤을 소유한다.

| 컨트롤 | 참조 |
|---|---|
| ↑ | `CTRL-UP` |
| ↓ | `CTRL-DOWN` |
| ← | `CTRL-LEFT` |
| → | `CTRL-RIGHT` |

## 동작

| 조건 | 동작 | 결과 |
|---|---|---|
| 빈 앵커가 컨트롤을 전달받음 | 보유 | 전달된 컨트롤을 소유 |
| 컨트롤을 보유한 앵커에 일반 오브젝트가 컨트롤을 사용해 접촉 | 환승 | 앵커의 기존 컨트롤 집합을 일반 오브젝트에게 전달하고 사용한 컨트롤을 앵커가 소유 |

## 관계

| 대상 | 관계 | 결과 |
|---|---|---|
| `OBJ-NORMAL` | `handoff` | 컨트롤 소유권 환승 |

## 예시

### Before

`BLOCK [↑] ↔ ANCHOR [→]`

### After

`BLOCK [→] ↔ ANCHOR [↑]`

## 사운드

| 이벤트 | 키 | 조건 |
|---|---|---|
| 컨트롤 수신 | <!-- 작성 --> | 컨트롤을 전달받음 |
| 환승 | <!-- 작성 --> | 컨트롤 소유 관계 변경 |

## 시각 표현

| 상태 또는 이벤트 | 표현 |
|---|---|
| 기본 | <!-- 작성 --> |
| 컨트롤 보유 | <!-- 작성 --> |
| 컨트롤 수신 | <!-- 작성 --> |
| 환승 | <!-- 작성 --> |

## 프리뷰

| 프리뷰 | 참조 |
|---|---|
| `Empty` | `OBJ-HANDOFF / Empty` |
| `Control / Single` | `OBJ-HANDOFF / 1 Control` |
| `Control / Multiple` | `OBJ-HANDOFF / Multiple Controls` |
| `Receive` | `OBJ-NORMAL → OBJ-HANDOFF` |
| `Handoff` | `OBJ-NORMAL ↔ OBJ-HANDOFF` |

## 참조

- `OBJ-NORMAL` — 일반 오브젝트
- `CTRL-UP`
- `CTRL-DOWN`
- `CTRL-LEFT`
- `CTRL-RIGHT`

## 규칙 근거

- CORE RULEBOOK · Object Reference · `Handoff Anchor`
- CORE RULEBOOK · Special Object Rules · `HANDOFF ANCHOR`