# 스와퍼

`OBJ-SWAPPER` · 오브젝트

두 대상이 소유한 컨트롤 집합 전체를 교환하는 오브젝트.

## 기본 정보

| 항목 | 값 |
|---|---|
| 블록명 | 스와퍼 |
| 식별자 | `OBJ-SWAPPER` |
| 키 | `object.swapper` |
| 블록 이미지 | <!-- 작성 --> |

## 동작

| 조건 | 동작 | 결과 |
|---|---|---|
| 교환 조건 성립 | 컨트롤 집합 교환 | 두 대상의 컨트롤 소유 집합 전체 교환 |

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