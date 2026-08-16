# 스와퍼

`OBJ-SWAPPER` · 스페셜 오브젝트

이동할 수 있는 스페셜 오브젝트. 다른 오브젝트와 충돌하면, 충돌한 두 오브젝트가 소유한 컨트롤 집합 전체를 서로 교환한다.

## 기본 정보

| 항목 | 값 |
|---|---|
| 블록명 | 스와퍼 |
| 식별자 | `OBJ-SWAPPER` |
| 키 | `object.swapper` |
| 타입 | 스페셜 |
| 이동 | 가능 — 소유한 컨트롤 방향으로 1칸 |
| 블록 이미지 | <!-- 작성 --> |

## 충돌 상호작용

| 충돌 주체 | 충돌 조건 | 동작 | 결과 |
|---|---|---|
| 스와퍼 | 소유한 컨트롤 입력, 비점유 타일 | 이동 | 해당 방향으로 1칸 이동 |
| 다른 오브젝트 | 스와퍼에 충돌 | 컨트롤 집합 교환 | 양쪽 위치를 유지하고, 두 컨트롤 집합 전체를 서로 교환 |
| 스와퍼 | 다른 오브젝트에 충돌 | 컨트롤 집합 교환 | 양쪽 위치를 유지하고, 두 컨트롤 집합 전체를 서로 교환 |

## 관계

| 대상 | 관계 | 결과 |
|---|---|---|
| 교환 대상 A | `swap` | 컨트롤 집합 교환 |
| 교환 대상 B | `swap` | 컨트롤 집합 교환 |

## 예시

### Before

`A [↑ ←]`

`B [↓ →]`

### After

`A [↓ →]`

`B [↑ ←]`

## 사운드

| 이벤트 | 키 | 조건 |
|---|---|---|
| 교환 | <!-- 작성 --> | 컨트롤 집합 교환 |

## 시각 표현

| 상태 또는 이벤트 | 표현 |
|---|---|
| 기본 | <!-- 작성 --> |
| 교환 대상 | <!-- 작성 --> |
| 컨트롤 집합 교환 | <!-- 작성 --> |

## 프리뷰

| 프리뷰 | 참조 |
|---|---|
| `Default` | `OBJ-SWAPPER` |
| `Swap` | `OBJECT-A ↔ OBJECT-B` |
| `Swap / Multiple Controls` | `OBJECT-A[] ↔ OBJECT-B[]` |

## 참조

- `CTRL-UP`
- `CTRL-DOWN`
- `CTRL-LEFT`
- `CTRL-RIGHT`

## 규칙 확인 필요

CORE RULEBOOK에서 교환 대상 표현이 일치하지 않는다.

- Object Reference: 두 일반 오브젝트
- Special Object Rules 예시: YOU와 BLOCK
- Representative Puzzle: YOU와 Plate 위 BLOCK

교환 가능한 대상 범위는 별도 확정이 필요하다.

## 규칙 근거

- CORE RULEBOOK · Object Reference · `Swapper`
- CORE RULEBOOK · Special Object Rules · `SWAPPER`
- CORE RULEBOOK · Representative Puzzle
