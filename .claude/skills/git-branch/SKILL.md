---
name: git-branch
description: >-
  Git 브랜치 생성, 전환, 이름 변경, 목록 확인, 삭제, 원격 동기화 등 브랜치 관리 작업을 안전하게 수행합니다.
  "브랜치 만들어줘", "브랜치 따줘", "브랜치 전환", "브랜치 이름 변경", "브랜치 삭제", "브랜치 정리", "새 브랜치에서 작업", "checkout",
  "switch branch", "create branch", "rename branch", "/git:branch" 등 브랜치와 관련된 요청이면 반드시 이 스킬을 사용하세요.
  사용자가 스킬 이름을 말하지 않아도 브랜치 작업이면 사용합니다. 커밋, push, PR 생성에는 사용하지 않습니다.
allowed-tools:
  - Bash(git branch:*)
  - Bash(git switch:*)
  - Bash(git checkout:*)
  - Bash(git status:*)
  - Bash(git stash:*)
  - Bash(git log:*)
  - Bash(git fetch:*)
  - Bash(git rev-parse:*)
  - Bash(git symbolic-ref:*)
  - Bash(git remote:*)
  - Bash(git reflog:*)
  - Bash(git cherry:*)
  - Bash(gh pr list:*)
  - Bash(gh repo view:*)
---

# Git 브랜치 관리

브랜치 생성·전환·이름 변경·삭제·동기화를 작업 손실 없이 처리한다. 모든 작업 전에 `git status`로 현재 상태를 먼저 확인한다. 브랜치는 로컬에서 되돌릴 수 있는 작업이지만, stash·강제 삭제·원격 변경은 작업을 잃을 수 있으므로 사용자 동의를 받는다.

## 요청 해석

- 브랜치명이 주어지면 → 이름 검증 후 새 브랜치 생성 및 전환
- 설명만 주어지면(예: "로그인 버그 수정용 브랜치") → 네이밍 규칙에 맞는 이름을 **제안하고 확인받은 뒤** 생성한다. 한국어 설명은 의미를 살려 영문 케밥 케이스로 옮긴다.
- 이미 존재하는 이름이면 → 새로 만들지 않고 전환할지 묻는다.
- "브랜치 관리"처럼 모호하면 → 생성 / 전환 / 이름 변경 / 목록 / 삭제 / 원격 동기화 중 무엇인지 묻는다.
- 커밋·push·PR 요청은 범위 밖이다. 각각 `git-commit`, `git-pr` 스킬로 안내한다.

## 기본 브랜치 찾기

`<기본>`이 필요한 모든 워크플로의 공통 단계. 이 저장소는 `origin/HEAD`가 설정돼 있지 않을 수 있으므로 순서대로 시도한다.

1. `git symbolic-ref --short refs/remotes/origin/HEAD` (예: `origin/main`)
2. 실패하면 `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`
3. 그래도 실패하면 `git branch -r`에 `origin/main`, `origin/develop` 중 있는 것. 둘 다 있으면 사용자에게 묻는다.

원격이 없는 저장소면 로컬 `main`/`develop`을 기준으로 하고, fetch 단계는 건너뛴다고 알린다.

## 워크플로

### 생성

1. `git status`로 uncommitted 변경사항과 현재 브랜치 확인. detached HEAD면 알린다.
2. 변경사항이 있으면 선택지를 준다: **새 브랜치로 가져가기**(기본 동작, 커밋되지 않은 변경은 그대로 따라온다) / stash / 먼저 커밋(`git-commit`). 임의로 stash하지 않는다.
3. 이름을 [네이밍 규칙](#네이밍-규칙)으로 검증하고, 위반이면 수정안을 제안한다. `git branch --list <이름>`과 `git branch -r --list origin/<이름>`으로 중복도 확인한다.
4. `git fetch origin`으로 최신화한 뒤 **원격 추적 브랜치에서 분기**한다: `git switch -c <이름> --no-track origin/<기본>`.
   - 로컬 `main`이 뒤처져 있어도 최신 상태에서 분기되고, 로컬 `main`을 건드리지 않는다.
   - `--no-track`은 새 브랜치의 upstream이 `origin/main`으로 잡혀 push가 main으로 향하는 사고를 막는다. upstream은 첫 push(`git push -u origin <이름>`) 때 설정된다.
   - 다른 브랜치에서 분기해야 하면 사용자가 명시한 경우에만 그 브랜치를 기준으로 쓴다.
   - fetch가 실패(오프라인 등)하면 로컬 `<기본>`에서 분기할 수 있다고 알리고 동의를 받는다.
5. 완료 보고: 생성된 브랜치, 분기 기준 커밋(`git log -1 --oneline`), 따라온 변경사항 유무.

### 전환

1. `git status`로 작업 상태 확인
2. 변경사항이 전환 대상과 충돌하면 stash를 제안한다. 동의하면 untracked 파일이 있을 때만 `-u`를 붙이고, 메시지에 이전 브랜치명을 넣는다: `git stash push -m "<이전 브랜치>: WIP"`.
3. `git switch <이름>`. 로컬에 없고 원격에만 있으면 `git fetch` 후 `git switch <이름>`(추적 브랜치 자동 생성)을 쓴다.
4. stash를 만들었다면 그 사실과 복구 방법(`git stash list`, `git stash pop`)을 알려준다. 이 브랜치에 이전에 만든 stash가 있으면(`git stash list`의 메시지로 확인) 되돌릴지 묻는다.
5. 다른 worktree에서 이미 체크아웃된 브랜치면 git이 전환을 거부한다. 해당 worktree 경로(`git worktree list`)를 알려준다.

### 이름 변경

- 로컬만: `git branch -m <새 이름>` (현재 브랜치) 또는 `git branch -m <옛 이름> <새 이름>`
- 이미 push된 브랜치면 원격 이름은 그대로이고, 열린 PR이 있으면 영향을 받는다. `gh pr list --head <옛 이름>`으로 확인해 알리고, 원격 이름 변경은 push가 필요하므로 명령만 안내한다.

### 목록 / 상태

- `git branch -vv`(추적 상태 포함), 필요 시 `git branch -r`
- 현재 브랜치, 원격과의 ahead/behind, `[gone]`(원격에서 삭제됨) 표시 여부, 병합 여부를 간단히 요약한다.

### 삭제

1. **보호 대상 확인**: 현재 브랜치, `main`, `develop`, 기본 브랜치는 삭제하지 않는다.
2. **병합 여부 판단**. `git branch --merged origin/<기본>`만 믿지 않는다. GitHub에서 squash/rebase로 병합하면 커밋 해시가 달라져 병합됐는데도 "병합 안 됨"으로 나온다.
   - `git branch --merged`에 있음 → 병합됨
   - 없으면 `gh pr list --state merged --head <이름>`으로 병합된 PR이 있는지 확인. 있으면 squash 병합으로 간주하되, PR 병합 **이후**에 추가된 커밋이 없는지(`git log <이름> --since=<병합 시각>` 등) 확인한다.
   - 둘 다 아니면 진짜 미병합이다.
3. 병합됨 → `git branch -d <이름>` (squash 병합이라 `-d`가 거부하면 위 확인 결과를 보여주고 동의를 받아 `-D`)
4. 미병합 → 손실될 커밋을 `git log <기본>..<이름> --oneline`으로 보여주고, 사용자가 명시적으로 동의한 경우에만 `-D`. 삭제 후 복구용으로 커밋 해시를 함께 알린다.
5. 원격 브랜치 삭제(`git push origin --delete`)는 이 스킬의 범위 밖이다. 명령만 안내하고 사용자가 직접 실행하게 한다.

### 원격 동기화 / 정리

- `git fetch --prune`으로 원격에서 삭제된 브랜치를 반영한다.
- 정리 대상은 `[gone]` 상태이면서 병합이 확인된 로컬 브랜치다. 삭제 전에 **목록과 각각의 병합 근거를 먼저 보여주고** 확인받는다(dry-run 방식). 일괄 삭제는 확인받은 목록에 한정한다.

## 네이밍 규칙

형식: `<프리픽스>/<소문자-케밥-케이스>`

| 프리픽스    | 용도                   | PR 제목 타입 |
| ----------- | ---------------------- | ------------ |
| `feature/`  | 새 기능                | `feat`       |
| `fix/`      | 버그 수정              | `fix`        |
| `hotfix/`   | 긴급 수정              | `fix`        |
| `docs/`     | 문서                   | `docs`       |
| `chore/`    | 빌드, 설정 등 유지보수 | `chore`      |
| `refactor/` | 리팩토링               | `refactor`   |
| `test/`     | 테스트                 | `test`       |

- 이슈 번호가 있으면 이름에 넣는다: `fix/123-login-validation-error`. `git-pr`이 `Closes #123`으로 연결한다.
- 이름은 영문 소문자·숫자·하이픈만 쓰고, 프리픽스 뒤 부분은 50자 이내로 한다.
- 좋은 예: `feature/user-authentication`, `fix/login-validation-error`, `chore/add-ci-workflow`
- 피할 것: 프리픽스 없음(`temp`), 대문자, 공백, 한글, 슬래시 대신 하이픈(`feature-user-auth`), 의미 없는 이름(`test2`, `my-branch`), `main`/`develop`/`HEAD`와 충돌하는 이름
- 저장소에 기존 브랜치 관례가 있으면(`git branch -a`) 그것이 이 표보다 우선한다.

## 안전 원칙

- 사용자 동의 없이 stash, 강제 삭제(`-D`), `reset --hard`를 하지 않는다. force push는 이 저장소에서 deny 처리되어 있으며 이 스킬에서도 하지 않는다.
- 작업이 사라진 것처럼 보이면 복구 방법을 안내한다: 삭제한 브랜치는 `git reflog` 후 `git switch -c <이름> <해시>`, stash된 변경은 `git stash list`.
- 브랜치 작업이 끝난 뒤 커밋이 필요하면 `git-commit`, 푸시·PR이 필요하면 `git-pr` 스킬로 이어간다.

## 완료 보고

수행한 작업을 짧게 보고한다: 현재 브랜치, 기준(분기 커밋 또는 삭제된 해시), 만든 stash나 삭제한 브랜치(있다면), 남은 미커밋 변경. 원격에는 아무것도 바꾸지 않았다면 그 사실도 한 줄로 밝힌다.
