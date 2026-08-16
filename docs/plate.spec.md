# 플레이트

`FIELD-PLATE` · 필드

일반 오브젝트의 점유에 의해 활성화되는 필드.

## 기본 정보

| 항목 | 값 |
|---|---|
| 블록명 | 플레이트 |
| 식별자 | `FIELD-PLATE` |
| 키 | `field.plate` |
| 블록 이미지 | <!-- 작성 --> |
| 활성화 대상 | `OBJ-NORMAL` |

## 상태

| 상태 | 키 | 조건 |
|---|---|---|
| 비활성 | `inactive` | 기본 상태 |
| 활성 | `active` | 일반 오브젝트가 점유 |

## 동작

| 조건 | 동작 | 결과 |
|---|---|---|
| 일반 오브젝트 점유 | 활성화 | `active` |
| 일반 오브젝트 이탈 | 비활성화 | `inactive` |

## 관계

| 대상 | 관계 | 결과 |
|---|---|---|
| `OBJ-NORMAL` | `activator` | 플레이트 상태 변경 |

## 사운드

| 이벤트 | 키 | 조건 |
|---|---|---|
| 활성화 | <!-- 작성 --> | `inactive → active` |
| 비활성화 | <!-- 작성 --> | `active → inactive` |

## 시각 표현

| 상태 또는 이벤트 | 표현 |
|---|---|
| `inactive` | <!-- 작성 --> |
| `active` | <!-- 작성 --> |
| 활성화 | <!-- 작성 --> |
| 비활성화 | <!-- 작성 --> |

## 프리뷰

| 프리뷰 | 참조 |
|---|---|
| `Inactive` | `FIELD-PLATE / inactive` |
| `Active` | `FIELD-PLATE / active` |
| `Activate` | `OBJ-NORMAL → FIELD-PLATE` |
| `Deactivate` | `OBJ-NORMAL ← FIELD-PLATE` |

## 참조

- `OBJ-NORMAL` — 일반 오브젝트

## 규칙 근거

- CORE RULEBOOK · Object Reference · `일반 오브젝트`
- CORE RULEBOOK · Field Reference · `PLATE`