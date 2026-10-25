---
name: git-pr
description: >-
  GitHub Pull Request를 생성하고 관리합니다. 커밋 히스토리와 변경사항을 분석해 한국어 제목·설명을 작성하고 `gh`로 PR을 만들며,
  기존 PR의 제목·본문 수정, Draft/Ready 전환, 상태·CI 확인, 리뷰 대기 목록 조회도 처리합니다.
  "PR 만들어줘", "PR 올려줘", "풀 리퀘스트 생성", "PR 설명 작성", "PR 설명 수정", "draft PR", "ready for review", "PR 상태",
  "create pull request", "open a PR", "/git:pr" 등 Pull Request와 관련된 요청이면 반드시 이 스킬을 사용하세요.
  사용자가 스킬 이름을 말하지 않아도 PR 작업이면 사용합니다. 커밋이나 브랜치 생성에는 사용하지 않습니다.
allowed-tools:
  - Bash(gh pr:*)
  - Bash(gh repo view:*)
  - Bash(gh label list:*)
  - Bash(gh issue view:*)
  - Bash(git push -u origin:*)
  - Bash(git push origin:*)
  - Bash(git status:*)
  - Bash(git log:*)
  - Bash(git diff:*)
  - Bash(git branch:*)
  - Bash(git fetch:*)
  - Bash(git rev-parse:*)
  - Bash(git symbolic-ref:*)
  - Bash(git merge-base:*)
---

# GitHub Pull Request

현재 브랜치의 변경사항을 분석해 PR을 만들고 관리한다. PR은 외부에 보이는 작업이고 알림이 나가므로, 생성·수정·병합·닫기 전에는 내용을 보여주고 사용자 확인을 받는다. 확인 없이 하는 것은 읽기 전용 조회뿐이다.

## 요청 해석

| 요청                              | 동작                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| 새 PR 생성 (제목·`--draft` 포함)  | [생성 워크플로](#생성-워크플로)                                      |
| "PR 설명/제목 수정", "설명 업데이트" | [기존 PR 수정](#기존-pr-수정)                                     |
| "ready로 바꿔줘", "draft로"       | `gh pr ready` / `gh pr ready --undo`                                 |
| "PR 상태", "CI 어때", "리뷰 대기" | 조회 ([관리 작업](#관리-작업))                                       |
| 병합·닫기                         | 대상과 영향을 확인받은 뒤에만 실행                                   |
| 커밋, 브랜치 생성                 | 범위 밖. `git-commit`, `git-branch` 스킬로 안내                      |

## 기본 브랜치(base) 찾기

`<base>`가 필요한 모든 단계의 공통 절차. 이 저장소는 `origin/HEAD`가 없을 수 있으므로 순서대로 시도한다.

1. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`
2. 실패하면 `git symbolic-ref --short refs/remotes/origin/HEAD`
3. 그래도 실패하면 `git branch -r`에서 `origin/main` → `origin/develop` 순으로 확인

사용자가 다른 base를 지정했으면 그것을 쓴다(`gh pr create --base`).

## 생성 워크플로

1. **사전 점검** (병렬 실행 가능)
   - `git status`: uncommitted 변경사항이 있으면 PR에 포함되지 않음을 알리고, 커밋이 필요하면 `git-commit` 스킬을 안내한다.
   - `git branch --show-current`: 비어 있으면 detached HEAD이므로 중단한다. 기본 브랜치면 중단하고 `git-branch` 스킬로 브랜치부터 만들도록 안내한다.
   - `gh pr list --head <현재 브랜치> --state all`: 열린 PR이 있으면 새로 만들지 말고 알린 뒤 [기존 PR 수정](#기존-pr-수정)을 제안한다. 이미 병합된 PR이 있으면 같은 브랜치 재사용 여부를 확인한다.
   - `gh auth status`: 실패하면 [문제 해결](#문제-해결)로.
2. **변경사항 분석**
   - `git fetch origin` 후 `git log origin/<base>..HEAD --format='%h %s%n%b'`로 커밋 목록을, `git diff origin/<base>...HEAD --stat`으로 변경 범위를 확인한다.
   - 커밋이 0개면 PR을 만들 수 없다고 알리고 멈춘다.
   - 필요하면 `git diff origin/<base>...HEAD`로 핵심 변경을 읽는다. 커밋 메시지를 이어 붙이지 말고 변경의 **목적과 영향**을 읽어낸다.
   - base가 앞서가 있으면(`git rev-list --count HEAD..origin/<base>`) 충돌 가능성을 알린다. rebase/merge는 사용자가 정한다.
   - 변경이 서로 무관한 영역에 걸쳐 크면 PR 분리를 제안한다. 강요하지는 않는다.
3. **안전 점검**: diff에 키·토큰·`service_role`로 보이는 문자열이나 `.env*`(`.env.example` 제외), `*.pem`이 있으면 푸시 **전에** 알리고 멈춘다. 푸시하면 원격에 남는다.
4. **로컬 검증 확인**: CI(`.github/workflows/ci.yml`)는 typecheck → lint → format:check → test → build를 돈다. 본문 "테스트 방법"에 쓰려면 실제로 돌려봐야 하므로, 사용자가 원하면 `npm run check`(build 제외)를 실행해 결과를 반영한다. 실행하지 않았으면 본문에 "로컬 검증 미실행"이라고 쓴다.
5. **푸시**: 원격에 브랜치가 없으면 `git push -u origin <브랜치>`, 있는데 뒤처졌으면 `git push origin <브랜치>`. force push는 하지 않는다(설정상 deny).
6. **제목·본문 초안**: 아래 규칙대로 만들어 사용자에게 보여준다. 제목, 본문, base, Draft 여부, 라벨·리뷰어를 한 번에 보여줘서 한 번의 확인으로 끝나게 한다.
7. **확인 후 생성**: 본문은 파일(`--body-file`)이나 heredoc으로 넘겨 줄바꿈과 백틱이 깨지지 않게 한다.

   ```bash
   gh pr create --base <base> --title "<제목>" --body "$(cat <<'EOF'
   <본문>
   EOF
   )"
   ```

   Draft면 `--draft`를 붙인다. 이슈 번호·아직 리뷰받을 단계가 아닌 작업·사용자가 "초안"이라고 한 경우에는 Draft를 제안한다.
8. **보고**: PR URL, 제목, base←head, Draft 여부, CI가 곧 시작된다는 점(`gh pr checks`로 확인 가능)을 알린다.

## 제목 규칙

`git-commit` 스킬과 같은 형식 `타입(스코프): 제목`을 쓴다. 병합 방식이 squash이면 PR 제목이 곧 main의 커밋 메시지가 되므로 특히 일관성이 중요하다. 이 저장소의 최근 커밋/PR 스타일(`git log -10 --format=%s`)이 있으면 그것이 이 문서보다 우선한다.

- **타입**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `perf`, `chore`. 브랜치 프리픽스로 추정하되(`feature/`→`feat`, `hotfix/`→`fix`, 나머지는 같은 이름), 실제 변경과 다르면 **변경 내용**을 따른다.
- **스코프**: 변경이 한 영역에 한정될 때만 `git-commit` 스킬의 스코프 표(`ui`, `auth`, `app`, `supabase`, `db`, `lib`, `config`, `deps`, `claude`)에서 고른다. 여러 영역이면 생략한다.
- 커밋이 하나면 그 제목을 그대로 쓰고, 여러 개면 전체를 아우르는 제목을 새로 쓴다.
- 한국어 명사형·간결체("추가", "수정", "적용"), 마침표 없음, 70자 이내. 코드 식별자·라이브러리명은 원문 그대로.
- Breaking change면 `feat(db)!: ...`처럼 `!`를 붙인다.

## 본문 템플릿

저장소의 PR 템플릿이 있으면 그것을 우선 사용한다. 위치는 `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE.md`, `docs/`, 루트, `.github/PULL_REQUEST_TEMPLATE/` 디렉터리(여러 개면 변경 성격에 맞는 것을 고르거나 묻는다)를 대소문자 구분 없이 찾는다. 템플릿의 섹션 구조는 유지하고 내용만 채운다. 없으면 아래 형식을 쓰되, 해당 없는 섹션은 지운다. (현재 이 저장소에는 템플릿이 없다.)

```markdown
## 변경사항 요약

(무엇을 왜 바꿨는지 1~3문장)

## 주요 변경내용

- 변경사항 1
- 변경사항 2

## 테스트 방법

(리뷰어가 확인할 수 있는 시나리오. 실제로 실행해 본 것만 적는다.)

## 관련 이슈

Closes #번호 (없으면 섹션 삭제)

## 참고사항

(리뷰어가 알아야 할 점, UI 변경 시 스크린샷)
```

- **정직하게 쓴다**: 하지 않은 테스트를 했다고 적지 않는다. 확인하지 못했다면 그렇게 쓴다. 체크리스트는 실제로 해당 작업이 있을 때만 넣는다.
- **배포 시 조치가 필요한 변경은 참고사항에 명시한다**: Supabase 마이그레이션/RLS 변경, 새 환경 변수, 의존성 대규모 변경. 리뷰어와 배포자가 놓치기 쉽다.
- **이슈 연결**: 브랜치명(`fix/123-...`)이나 커밋의 `Fixes #123`/`Refs #123`에서 번호를 찾는다. 닫는 PR이면 `Closes #번호`, 참조만이면 `Refs #번호`. 번호가 실제 존재하는지 모르면 `gh issue view`로 확인한다.
- **Breaking change**는 본문 최상단에 영향과 마이그레이션 방법을 적는다.
- **파일 나열 금지**: diff가 이미 보여주는 파일 목록을 옮겨 적지 않는다.
- 세션이 PR 설명 attribution 문구를 지정했다면(예: "🤖 Generated with ..."), 본문 맨 끝에 빈 줄을 두고 **지정된 문구 그대로** 추가한다. 지정이 없으면 임의로 만들어 붙이지 않는다.

## 메타데이터

- 라벨은 `gh label list`에 있는 것만 쓰고, 없는 라벨을 임의로 만들지 않는다. 사용자가 지정했거나 타입에서 명확히 대응되는 것(예: `bug` ↔ `fix`)만 제안한다.
- 리뷰어·담당자·마일스톤은 사용자가 지정했거나 `CODEOWNERS`처럼 저장소에 근거가 있을 때만 설정한다. 혼자 쓰는 저장소라면 비워 둔다.

## 기존 PR 수정

1. `gh pr view <번호|브랜치> --json title,body,baseRefName,isDraft,commits`로 현재 내용을 읽는다.
2. 새 커밋이 추가됐다면 그 변경을 반영해 제목·본문 수정안을 만든다. 사용자가 직접 쓴 내용은 지우지 말고 보존하며, 바뀐 부분만 diff 형태로 보여준다.
3. 확인 후 `gh pr edit <번호> --title ... --body ...`. 추가 커밋은 `git push origin <브랜치>`로 올린다.

## 관리 작업

| 요청                  | 명령                                                             |
| --------------------- | ---------------------------------------------------------------- |
| Draft → Ready         | `gh pr ready`                                                    |
| Ready → Draft         | `gh pr ready --undo`                                             |
| 내 PR 상태            | `gh pr status`                                                   |
| 리뷰 대기 목록        | `gh pr list --search "review-requested:@me"`                     |
| 충돌 있는 PR          | `gh pr list --json number,title,mergeable` 후 `CONFLICTING` 필터 |
| PR 상세               | `gh pr view`                                                     |
| CI 결과               | `gh pr checks` (실패 시 어떤 단계가 실패했는지 요약해 보고)      |

Ready 전환은 CI 통과 여부를 먼저 확인하고, 실패 중이면 알린 뒤 전환할지 묻는다.

**병합(`gh pr merge`)과 닫기(`gh pr close`)는 되돌리기 어렵다.** PR 번호와 제목, 병합 방식(merge/squash/rebase), CI 상태, 리뷰 상태를 보여주고 명시적 동의를 받은 뒤 실행한다. 병합 방식을 사용자가 정하지 않았으면 묻는다. 일괄 병합·일괄 닫기는 하지 않는다. 병합 후 로컬 브랜치 정리는 `git-branch` 스킬로 이어간다(squash 병합 브랜치의 판별 방법이 거기 있다).

## 문제 해결

- **`gh` 인증 오류** → `! gh auth login`을 직접 실행하도록 안내한다(대화형이라 대신 실행할 수 없다).
- **푸시 거부** → 원격이 앞서 있으면 `git fetch` 후 상태(`git log HEAD..origin/<브랜치>`)를 보여주고, 사용자가 방법을 정하게 한다. force push로 해결하지 않는다.
- **PR 생성 실패** → 중복 PR, base 브랜치 이름, 푸시 여부, 커밋 수(0개) 순으로 확인한다.
- **pre-push hook / CI 실패** → hook을 우회하지 않는다. 실패 원인을 보고하고 고칠지 묻는다.
- **템플릿 필수 항목을 채울 수 없음** → 임의로 채우지 말고 "미확인"으로 표기하거나 사용자에게 묻는다.

## 완료 보고

PR URL, 최종 제목, `base ← head`, Draft 여부, 포함된 커밋 수, 설정한 라벨·리뷰어(있다면), 로컬 검증 실행 여부를 간결하게 보고한다.
