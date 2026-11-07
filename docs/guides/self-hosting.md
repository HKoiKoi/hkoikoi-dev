# 홈 서버 배포 가이드

hkoikoi.dev는 Mac mini 홈 서버에서 직접 서비스한다(2026-11-07 Vercel에서 이전). 이 문서는 서버를 처음부터 재현하는 절차, 배포·롤백, 장애 대응, 보안 규칙, 알려진 한계를 적는다. 명령은 Task 035~043에서 실제로 수행한 것이고, 확인하지 않은 부분은 그렇게 표시했다. 시크릿 값·토큰·내부 IP·실제 사용자명은 적지 않는다(`<서버 사용자>`, `~`로 표기).

## 아키텍처

```
방문자
  │ HTTPS
  ▼
Cloudflare (DNS, 프록시, TLS 종료)
  │ 터널(아웃바운드 연결, 포트포워딩 없음)
  ▼
cloudflared            시스템 데몬 (launchd, /Library/LaunchDaemons)
  │ HTTP
  ▼
Caddy                  127.0.0.1:8080  (brew services, 사용자 LaunchAgent)
  │  hkoikoi.dev  → reverse_proxy
  │  그 외 호스트 → 308 https://hkoikoi.dev{uri}
  ▼
Next.js                127.0.0.1:3000  (launchd 사용자 LaunchAgent `dev.hkoikoi.web`)
  │  WorkingDirectory ~/apps/current → releases/<SHA>
  ▼
Supabase               인증·DB·스토리지 (원격)
```

- 정식 호스트는 **apex(`hkoikoi.dev`)** 이고 `www.hkoikoi.dev`는 apex로 308 리다이렉트한다(`NEXT_PUBLIC_SITE_URL=https://hkoikoi.dev`).
- 3000·8080은 `127.0.0.1`에만 바인딩한다. 외부에서 직접 접근할 수 없다(작업 PC에서 `nc -z`로 확인).
- 배포는 서버에서 실제 `.env.local`로 빌드한 릴리스 폴더를 `current` 심볼릭 링크로 교체하는 방식이다. GitHub Secrets는 쓰지 않는다.

```
~/apps/
├── current            → releases/<SHA>  (심볼릭 링크, 서비스가 보는 경로)
├── releases/<SHA>/    각 릴리스(소스 + node_modules + .next, 약 1GB)
└── shared/.env.local  운영 환경 변수(서버에만 존재, 권한 600)
~/logs/                web.log, web.err.log (앱), 배포 리허설 로그 등
~/actions-runners/hkoikoi-dev/   GitHub Actions self-hosted runner
```

## 서버 초기 설정

서버는 SSH로 접속한다(작업 PC의 `~/.ssh/config`에 별칭을 둔다). 아래 순서로 진행하면 재현된다.

### 1. macOS

- **FileVault는 끈다**(재부팅 후 비밀번호 없이 올라와야 한다). `fdesetup status`로 확인한다.
- **자동 로그인**을 켠다(시스템 설정 > 사용자 및 그룹 > 자동 로그인). Caddy(`brew services`)와 앱·runner는 모두 **사용자 LaunchAgent**라 로그인 세션이 있어야 재부팅 후 기동된다.
  - `sudo sysadminctl -autologin set -userName <서버 사용자> -password -`는 이 서버(macOS 27.2)에서 `SACSetAutoLoginPassword error:22`로 실패했고 `/etc/kcpassword`가 생기지 않았다. `autoLoginUser` 값만 남아 있어 설정된 것처럼 보이므로 **설정 값이 아니라 `/etc/kcpassword` 존재와 재부팅 후 `stat -f %Su /dev/console`이 서버 사용자인지로 확인한다.**
  - 모니터 없이 설정하려면 화면 공유가 필요하다. `homeserver` 같은 SSH 별칭은 VNC 주소로 쓸 수 없으므로 `vnc://<호스트>.local`을 쓴다.
- 시스템 설정 > 에너지에서 "정전 후 자동으로 시동"을 켜 둔다(이 항목을 켰는지는 문서 작성 시점에 확인하지 않았다).

### 2. Homebrew 패키지와 Node

```bash
export PATH=/opt/homebrew/bin:$PATH
brew install git node@24 caddy
brew unlink node 2>/dev/null; brew link --overwrite --force node@24
node -v   # 저장소 .nvmrc(24)와 같은 메이저인지 확인. engines는 >=20.9
```

`brew install node`는 최신 메이저(이 서버에서는 26)를 깔아 `.nvmrc`와 어긋나므로 `node@24`를 링크한다.

### 3. 디렉터리와 환경 변수

```bash
mkdir -p ~/apps/releases ~/apps/shared ~/logs
touch ~/apps/shared/.env.local && chmod 600 ~/apps/shared/.env.local
```

`~/apps/shared/.env.local`은 **서버에서 직접 편집기로 작성한다**(대화·저장소·CI에 값을 남기지 않는다).

| 키                                     | 값                                                       |
| -------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | 운영 Supabase 프로젝트 URL                               |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | publishable(anon) 키                                     |
| `NEXT_PUBLIC_SITE_URL`                 | `https://hkoikoi.dev` (끝 슬래시 없음, 정식 호스트 기준) |

`NEXT_PUBLIC_*` 값은 **빌드 시점에** 번들에 들어가므로 값을 바꾸면 다시 배포(빌드)해야 한다. 값은 읽지 않고 키 이름과 비어 있는지만 점검한다: `cut -d= -f1 ~/apps/shared/.env.local`.

### 4. Caddy

`deploy/caddy/Caddyfile`을 서버의 `/opt/homebrew/etc/Caddyfile`에 둔다.

```bash
caddy validate --config /opt/homebrew/etc/Caddyfile --adapter caddyfile
brew services restart caddy
```

- 자동 HTTPS는 끈다(TLS는 Cloudflare가 종료). `127.0.0.1:8080`에서 평문 HTTP만 받는다.
- `encode`는 켜지 않았다. 스트리밍(Suspense)은 Caddy와 터널 모두에서 버퍼링되지 않음을 확인했고(아래 검증 기록), 압축은 Cloudflare 엣지가 한다.
- 호스트를 추가하려면(예: 임시 검증 호스트) 서버의 Caddyfile `@canonical host` 줄에만 추가하고, 끝나면 저장소 템플릿으로 되돌린다. 저장소 템플릿에는 임시 호스트를 넣지 않는다.

### 5. 앱 서비스(launchd)

```bash
sed "s|__HOME__|$HOME|g" deploy/launchd/dev.hkoikoi.web.plist > ~/Library/LaunchAgents/dev.hkoikoi.web.plist
plutil -lint ~/Library/LaunchAgents/dev.hkoikoi.web.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.hkoikoi.web.plist
```

- `KeepAlive`가 켜져 있어 프로세스를 죽이면 자동 재시작한다(pid가 바뀌는 것을 확인했다).
- `~/apps/current`가 없으면 서비스가 뜨지 않는다. 첫 배포(아래 "수동 배포")로 만든다.

### 6. Cloudflare 터널과 DNS

터널(`cloudflared`)은 시스템 데몬으로 이미 구성되어 있다(`/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`, 토큰 파일 방식의 원격 관리 터널). 설치는 블로그 구축기 2편을 따른다. 터널 설정은 **Cloudflare 대시보드**에서 바꾼다(서버에서 바꿀 수 없다).

- Zero Trust > Networks > Tunnels > 이 터널 > Published application routes에 다음 두 호스트를 `HTTP` / `localhost:8080`으로 등록한다.
  - `hkoikoi.dev` (정식)
  - `www.hkoikoi.dev` (Caddy가 apex로 308 리다이렉트)
- 라우트를 추가하면 DNS(Proxied CNAME)가 자동으로 생긴다. 라우트를 지우면 DNS도 사라진다.
- Cloudflare는 프록시 응답의 `robots.txt` 앞에 AI 크롤러 차단 "Managed content"를 붙인다. 앱의 규칙(`Disallow: /admin`, `/auth`, `Sitemap:`)은 뒤에 그대로 남는다. 의도한 설정인지는 확인하지 못했다.

### 7. GitHub Actions runner

저장소는 public이므로 보안 규칙(아래 "보안")을 먼저 읽는다.

1. GitHub 저장소 Settings > Actions > Runners > New self-hosted runner(macOS ARM64)에서 **등록 토큰**을 발급한다(1시간 만료. 대화·로그에 남기지 않고 서버 터미널에 직접 입력한다).
2. 서버에서:

   ```bash
   mkdir -p ~/actions-runners/hkoikoi-dev && cd ~/actions-runners/hkoikoi-dev
   # 대시보드가 안내하는 버전의 tar.gz를 받아 체크섬을 대조한 뒤 풀어 둔다
   ./config.sh --url https://github.com/HKoiKoi/hkoikoi-dev --token <토큰> \
     --labels homeserver --name hkoikoi-dev --unattended --replace
   ./svc.sh install && ./svc.sh start && ./svc.sh status
   ```

3. 다른 프로젝트도 올릴 때는 프로젝트마다 `~/actions-runners/<프로젝트>`에 따로 설치하고 각 저장소에 등록한다(runner는 저장소 단위다).
4. GitHub에서 runner가 `online`(Idle)인지, **재부팅 후 로그인 없이** 다시 Idle로 돌아오는지 확인한다.

### 8. Supabase Auth URL

앱은 비밀번호 로그인(`signInWithPassword`)만 쓰고 이메일 링크·OAuth 흐름이 없어서 지금은 영향이 없다. 그래도 정식 호스트와 맞춰 둔다: Site URL `https://hkoikoi.dev`, Redirect URLs에 `https://hkoikoi.dev/**`(로컬 개발용 `http://localhost:3000/**` 유지). 사용자가 대시보드에서 직접 설정했다(값은 MCP로 읽을 수 없어 확인하지 못했다).

## 배포

### 자동 배포

`main`에 머지(push)하면 CI가 `check`(`typecheck`·`lint`·`format:check`·`test`·`build`)와 `e2e-smoke`를 돌리고, 둘 다 통과하면 `deploy` job이 self-hosted runner(`[self-hosted, macOS, homeserver]`)에서 `deploy/deploy.sh "$GITHUB_SHA"`를 실행한다.

- `deploy`는 `push to main`에서만 실행된다. PR(포크 포함)에서는 `skipped`다.
- `concurrency: deploy-prod`(취소 없음)로 배포끼리 겹치지 않는다. workflow 수준의 `ci-<ref>` 그룹은 `main`에서 이전 실행을 취소하지 않는다(배포 도중 취소 방지, 대기 실행은 최신 하나만 남는다).
- 브랜치 흐름은 feature → `develop`(PR) → `main`(PR). `main`에 머지하는 순간 운영 배포가 시작된다.

### `deploy.sh`가 하는 일

`deploy/deploy.sh <SHA> [소스 저장소 경로]`(기본 소스는 `$GITHUB_WORKSPACE`, 없으면 현재 디렉터리).

1. `git archive`로 `~/apps/releases/<SHA>`에 소스를 추출하고 `shared/.env.local`을 링크한다.
2. `npm ci` → `npm run build`(실제 env). **빌드가 실패하면 미완성 폴더를 지우고 `current`는 건드리지 않는다.**
3. 임시 링크를 만든 뒤 `mv -fh`로 `current`를 원자적으로 교체하고 `launchctl kickstart -k`로 서비스를 재시작한다.
4. 헬스체크(`http://127.0.0.1:3000/`이 200, 2초 간격 최대 15회). **실패하면 이전 릴리스로 링크를 되돌려 재시작하고 종료 코드 1로 끝난다**(실패한 릴리스는 조사용으로 남긴다).
5. 성공하면 **현재·직전 릴리스를 제외하고 최근 5개만** 남기고 지운다(`KEEP_RELEASES`로 조정).

환경 변수로 `APPS_DIR`, `SERVICE_LABEL`, `HEALTH_URL`, `HEALTH_INTERVAL`, `HEALTH_RETRIES`, `KEEP_RELEASES`를 바꿀 수 있다(리허설에서 `HEALTH_URL`로 실패를 유도했다). macOS 전용이다(BSD `mv -h`, `launchctl`).

### 수동 배포

CI를 거치지 않고 서버에서 직접 배포할 때(첫 배포, CI 장애):

```bash
export PATH=/opt/homebrew/bin:$PATH
git clone https://github.com/HKoiKoi/hkoikoi-dev.git ~/src && cd ~/src
git checkout <브랜치 또는 SHA>
deploy/deploy.sh "$(git rev-parse HEAD)" ~/src
```

실패하면 `~/logs`와 위 스크립트 출력으로 원인(Node 버전, env 누락)을 먼저 고친다. 로그를 공유할 때 env 값이 섞이지 않았는지 확인한다(빌드 로그에는 값이 출력되지 않음을 확인했다).

## 롤백

- **자동 롤백**: 헬스체크 실패 시 `deploy.sh`가 이전 릴리스로 되돌린다. 위 4번 참고.
- **수동 롤백**(배포는 성공했지만 앱에 문제가 있을 때): 이전 릴리스로 링크를 바꾸고 재시작한다.

  ```bash
  ls -1t ~/apps/releases                       # 최신순, 첫째가 현재, 둘째가 직전
  ln -s ~/apps/releases/<이전 SHA> ~/apps/current.tmp
  mv -fh ~/apps/current.tmp ~/apps/current
  launchctl kickstart -k gui/$(id -u)/dev.hkoikoi.web
  curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/
  ```

  스크립트의 롤백 분기와 같은 명령이지만 이 수동 절차 자체를 따로 시험하지는 않았다. 롤백 대상은 현재·직전 릴리스뿐이다(나머지는 정리 규칙으로 지워질 수 있다).

- 되돌린 뒤에는 `main`을 같은 SHA로 되돌리는 PR을 올리지 않으면 다음 머지에서 다시 문제 코드가 배포된다.
- **Vercel 롤백 경로는 없다.** 이전 후 Vercel 프로젝트는 삭제하기로 했다(사용자 결정, 삭제 완료 여부는 문서 작성 시점에 확인하지 못했다). DNS는 이미 홈 서버를 가리킨다.

## 장애 대응

먼저 어디까지 살아 있는지 안쪽부터 확인한다(서버에서).

```bash
curl -s -o /dev/null -w "앱 3000: %{http_code}\n" http://127.0.0.1:3000/
curl -s -o /dev/null -w "Caddy 8080: %{http_code}\n" -H "Host: hkoikoi.dev" http://127.0.0.1:8080/
```

| 증상                              | 확인                                                                                                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 외부 502                          | Caddy는 살았는데 앱이 죽음. `tail -n 50 ~/logs/web.err.log`, `launchctl print gui/$(id -u)/dev.hkoikoi.web`(state·pid·last exit), `launchctl kickstart -k gui/$(id -u)/dev.hkoikoi.web` |
| 외부 530 / 1016                   | 터널이 끊겼거나 DNS가 없음. `pgrep -fl cloudflared`, `tail /Library/Logs/com.cloudflare.cloudflared.err.log`, 대시보드에서 터널 상태·라우트 확인                                        |
| 3000은 200인데 8080이 실패        | `brew services list`로 caddy 상태, `caddy validate --config /opt/homebrew/etc/Caddyfile --adapter caddyfile`, `brew services restart caddy`                                             |
| 재부팅 후 앱·Caddy·runner가 안 뜸 | 자동 로그인이 안 된 것. `stat -f %Su /dev/console`이 서버 사용자인지, `/etc/kcpassword` 존재 확인. 모니터가 없으면 화면 공유로 로그인                                                   |
| GitHub에서 runner가 offline       | 서버에서 `cd ~/actions-runners/hkoikoi-dev && ./svc.sh status`, `_diag/`의 최근 로그, `./svc.sh start`                                                                                  |
| deploy job 실패                   | Actions 로그에서 `[deploy]` 줄 확인. 빌드 실패면 `current` 불변이라 사이트는 영향 없음. 헬스체크 실패면 자동 롤백됨                                                                     |
| 글 발행·삭제가 화면에 안 반영     | 실제 env 빌드 표에서 해당 라우트가 `ƒ`/`◐`인지(정적 `○`으로 굳지 않았는지), 앱 로그의 Supabase 오류 확인                                                                                |

## 보안

- **public 저장소 + self-hosted runner 규칙**
  - `deploy` job은 `push to main`에서만 이 runner를 쓴다. `pull_request`에서는 절대 쓰지 않는다. 이 조건을 `ci.yml`에서 바꾸지 않는다.
  - Settings > Actions > General: fork PR 워크플로는 `all_external_contributors`(외부 기여자 전원 승인 필수)로 설정했다. workflow 기본 권한은 `read`, PR 리뷰 자동 승인은 꺼져 있다. job도 `permissions: contents: read`다.
  - `.github/`를 바꾸는 PR은 runner를 노릴 수 있으므로 병합 전에 직접 읽는다.
- **시크릿**: 운영 `.env.local`은 서버의 `~/apps/shared/`에만 두고 권한 600을 유지한다. GitHub Secrets에도 저장소에도 올리지 않는다. runner 작업 디렉터리에는 앱 시크릿이 없다(runner 자체 인증 파일만 있음을 확인했다).
- **여러 프로젝트의 runner**: 같은 서버·같은 사용자 계정에 여러 runner를 두면 한 프로젝트의 워크플로가 다른 프로젝트의 파일(`~/apps/shared/.env.local` 포함)을 읽을 수 있다. 본인 저장소끼리만 쓰고 모든 저장소에 fork PR 승인 필수를 건다.
- **자동 로그인 trade-off**: 서버에 물리적으로 접근하면 로그인된 상태가 노출된다. 1편 전제(FileVault 끔, 집 안에 둠)를 받아들인 선택이다. 완화책은 서버 계정에 강한 비밀번호, 화면 공유·SSH 접근 제한, 물리 접근 통제다.
- **외부 노출**: 포트포워딩은 없다. 외부에서 열린 포트는 없고 Cloudflare 터널(아웃바운드)로만 들어온다. 3000·8080은 루프백에만 바인딩한다.

## 알려진 한계

- **단일 인스턴스, 무중단 아님**: 배포·롤백·재시작마다 서비스가 1~3초 끊긴다. 롤백 리허설 중 응답을 약 3초 간격으로 33회 기록했을 때 롤백 재시작 순간에 502가 1번 나왔다. 간격이 길어 정확한 끊김 시간은 측정하지 못했다.
- **재부팅하면 약 1분 가까이 끊긴다**: 15분 응답 기록(279회)의 재부팅 구간에서 Cloudflare 530이 13번(약 3초 간격이면 40초 안팎), 연결 실패가 1번 나왔다. 근사치다.
- **정전·회선 단절 = 서비스 중단**: UPS와 이중 회선이 없다. 정전 후 자동 시동(에너지 설정)과 자동 로그인이 모두 켜져 있어야 스스로 복구한다.
- **Vercel 롤백 경로 없음**: 위 "롤백" 참고. 서버가 완전히 망가지면 새 서버에서 이 문서의 "서버 초기 설정"을 다시 따라 복구한다.
- **디스크**: 릴리스 하나가 약 1GB(`node_modules`+`.next`)다. 현재·직전·최근 5개로 최대 약 7GB를 쓴다(서버 디스크 460GB 중 4% 사용 중).
- **macOS 업데이트**: 재부팅을 일으키므로 직접 시점을 정해 위 재부팅 중단을 감수한다. 자동 업데이트의 자동 재시작은 확인하지 않았다.
- **로컬 DNS 캐시**: DNS 레코드를 새로 만든 직후에는 작업 PC의 캐시에 "없음"이 남아 `curl`이 실패할 수 있다(`dig`로는 보임). `curl --resolve <호스트>:443:<IP>`로 우회해 확인한다.

## 검증 기록(Task 035~043)

실제로 확인한 결과만 적는다. 자세한 항목은 `docs/ROADMAP.md` Phase 7.

- 서버: 재부팅 후 비밀번호 없이 로그인, Node 24, 디렉터리·`.env.local` 권한 600, 재부팅 후 앱·Caddy·cloudflared·runner 자동 기동.
- 빌드: 실제 env 빌드 성공, 공개 페이지 대부분 `◐`, `/sitemap.xml` `ƒ`, 로그에 env 값 없음.
- 프록시: 8080에서 `hkoikoi.dev` 200, 다른 호스트 308(경로·쿼리 유지), 3000·8080 외부 접근 불가, 앱 프로세스를 죽이면 자동 재시작.
- 터널 경유: 공개 페이지·썸네일·콘솔 오류 0건, `/admin` 비로그인 리다이렉트, 스트리밍 비버퍼링(느린 스트림 임시 엔드포인트로 약 1초 간격 도착 확인).
- `deploy.sh` 리허설: 정상 배포, 헬스체크 실패 시 롤백(종료 코드 1, `current` 복구), 빌드 실패 시 `current` 불변, 릴리스 정리(현재·직전 보존).
- CI: PR에서 `deploy` skipped, `main` 머지 후 `check`·`e2e-smoke`·`deploy` 성공, `current`가 새 SHA로 교체.
- 운영(apex): 공개 경로 200, `www`→apex 308, sitemap·robots·og:image가 apex 절대 URL, 글 발행·삭제 직후 홈·`/blog`·상세·sitemap 즉시 반영, DB의 `e2e-` 행 0건.
- 확인하지 못한 것: 동시에 두 번 push했을 때 deploy가 겹치지 않는지(설정으로만 보장), 수동 롤백 절차, "정전 후 자동 시동" 설정, macOS 자동 업데이트의 자동 재시작.
