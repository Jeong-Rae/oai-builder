# 플레이어

`OBJ-PLAYER` · 오브젝트

컨트롤을 소유하고 소유한 방향으로 이동하는 플레이어의 기준점.

## 기본 정보

| 항목     | 값               |
| ------ | --------------- |
| 블록명    | 플레이어            |
| 식별자    | `OBJ-PLAYER`    |
| 키      | `object.player` |
| 블록 이미지 | <!-- 작성 -->     |
| 이동 단위  | 1칸              |

## 소유권

| 컨트롤 | 참조           |
| --- | ------------ |
| ↑   | `CTRL-UP`    |
| ↓   | `CTRL-DOWN`  |
| ←   | `CTRL-LEFT`  |
| →   | `CTRL-RIGHT` |

소유한 컨트롤이 입력되면 해당 방향의 행동 주체가 된다.

## 동작

| 조건                | 동작     | 결과              |
| ----------------- | ------ | --------------- |
| 소유한 컨트롤 입력        | 이동     | 해당 방향으로 1칸 이동   |
| 이동 방향에 일반 오브젝트 존재 | 컨트롤 전달 | 사용한 컨트롤의 소유자 변경 |

## 관계

| 대상           | 관계         | 결과         |
| ------------ | ---------- | ---------- |
| `OBJ-NORMAL` | `transfer` | 사용한 컨트롤 전달 |

## 사운드

| 이벤트    | 키           | 조건              |
| ------ | ----------- | --------------- |
| 이동     | <!-- 작성 --> | 실제 위치 변경        |
| 컨트롤 전달 | <!-- 작성 --> | 사용한 컨트롤의 소유자 변경 |

## 시각 표현

| 상태 또는 이벤트 | 표현          |
| --------- | ----------- |
| 기본        | <!-- 작성 --> |
| 이동        | <!-- 작성 --> |
| 컨트롤 소유    | <!-- 작성 --> |
| 컨트롤 전달    | <!-- 작성 --> |

## 프리뷰

| 프리뷰                  | 참조                               |
| -------------------- | -------------------------------- |
| `Default`            | `OBJ-PLAYER`                     |
| `Control / Single`   | `OBJ-PLAYER / 1 Control`         |
| `Control / Multiple` | `OBJ-PLAYER / Multiple Controls` |
| `Move`               | `OBJ-PLAYER / Move`              |
| `Transfer`           | `OBJ-PLAYER → OBJ-NORMAL`        |

## 참조

* `OBJ-NORMAL` — 일반 오브젝트
* `CTRL-UP`
* `CTRL-DOWN`
* `CTRL-LEFT`
* `CTRL-RIGHT`

## 규칙 근거

* CORE RULEBOOK · How to Read the Game
* CORE RULEBOOK · Turn Resolution
* CORE RULEBOOK · Ownership Transfer
* CORE RULEBOOK · Object Reference · `플레이어의 기준점`
