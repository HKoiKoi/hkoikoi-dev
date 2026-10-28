# RLS 검증 절차

`posts` 테이블과 `blog-images` 스토리지의 RLS가 의도대로인지 Supabase MCP `execute_sql`로 점검하는 읽기 전용 절차다. e2e는 실제 DB와 일반 로그인 계정이 필요한데 회원가입이 막혀 있고(관리자 1인), CI의 `e2e-smoke`는 placeholder Supabase 값이라 RLS를 검증하지 못한다. 그래서 정책을 바꾸는 마이그레이션을 적용한 직후에 이 절차를 수동으로 돌린다.

## 규칙

- 원격 프로젝트가 `.mcp.json`의 `project_ref`와 같은지 `get_project_url`로 먼저 확인한다.
- 읽기 전용 점검만 한다. 항상 `begin read only; ... rollback;`으로 감싸 실수로 쓰기를 넣어도 DB가 거부하게 한다.
- service role 키는 쓰지 않는다. `.env`는 읽지 않는다.
- MCP 기본 역할은 `postgres`라 RLS를 우회한다. 반드시 `set local role anon|authenticated`로 전환한 뒤 조회한다. 전환하지 않으면 항상 통과하는 가짜 검증이다.
- 한 번의 `execute_sql` 호출은 마지막 결과셋만 돌려준다. 점검마다 호출을 나눈다.

## 점검 SQL

기대값과 다르면 정책이 회귀한 것이다.

### A. 비로그인은 발행 글만 조회 (anon)

```sql
begin read only;
set local role anon;
select count(*) filter (where published) as pub,
       count(*) filter (where not published) as drafts,
       current_user as role
from public.posts;
rollback;
```

기대: `drafts = 0`, `role = anon`.

### B. user_metadata 위조로 권한 상승 불가 (authenticated)

`app_metadata.role`이 `user`이고 `user_metadata.role`만 `admin`인 JWT claims를 흉내 낸다.

```sql
begin read only;
select set_config('request.jwt.claims',
  '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"user"},"user_metadata":{"role":"admin"}}', true);
set local role authenticated;
select (select count(*) from public.posts where not published) as drafts,
       (select count(*) from storage.objects where bucket_id = 'blog-images') as objs,
       current_user as role;
rollback;
```

기대: `drafts = 0`, `objs = 0`, `role = authenticated`.

### C. 정책 정의 정적 검사

```sql
select count(*) filter (where qual ilike '%user_metadata%' or with_check ilike '%user_metadata%') as user_metadata_refs,
       count(*) filter (where schemaname = 'storage' and tablename = 'objects'
                        and cmd in ('SELECT', 'ALL')) as storage_select_policies,
       count(*) as total_policies
from pg_policies
where (schemaname = 'public' and tablename = 'posts')
   or (schemaname = 'storage' and tablename = 'objects');
```

기대: `user_metadata_refs = 0`, `storage_select_policies = 0`, `total_policies = 7`(posts 4개, blog-images 3개). 정책을 추가·삭제했다면 총 개수 기대값도 함께 고친다.

## 검증 대상과 근거

| 대상                                 | 점검                                      | 근거                                                                                           |
| ------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 비로그인은 `published = true`만 조회 | A, 정책 `posts_select_published_or_admin` | anon에 적용되는 정책은 SELECT 하나이고 admin 식은 anon JWT에서 거짓                            |
| 일반 로그인 사용자는 쓰기 불가       | C(정책 정의), 쓰기 거부는 아래 한계 참고  | insert/update/delete 정책이 모두 `app_metadata.role = 'admin'`을 요구                          |
| `user_metadata`로 권한 상승 불가     | B, C                                      | 정책 7개 모두 `auth.jwt() -> 'app_metadata'`만 참조                                            |
| `blog-images` select 정책 부재       | C                                         | `storage.objects`의 SELECT 정책 0개(list API 노출 방지, 공개 URL은 select 정책 없이 접근 가능) |

## 한계

- 초안 행이 DB에 없으면 A, B의 `drafts = 0`은 "차단됨"과 "원래 없음"을 구분하지 못한다. 정책 정의 점검(C)이 본질이고 A, B는 보조 증거다.
- 쓰기 거부(일반 사용자 insert/update/delete)는 읽기 전용 트랜잭션으로 증명할 수 없다. 운영 DB에 쓰기를 시도하는 점검은 이 절차에 넣지 않는다. Task 017 이월 항목에 `blog-images` INSERT 거부를 롤백되는 DO 블록으로 확인한 기록이 있다(ROADMAP 참고). 정책을 크게 바꿀 때만 같은 방식을 사용자 확인 후 수동으로 쓴다.
- `set_config('request.jwt.claims')`는 PostgREST가 JWT를 풀어 넣는 경로와 같지만 서명 검증 단계는 포함하지 않는다. 실제 비관리자 계정으로 로그인한 세션 검증은 하지 않는다(관리자 1명만 두는 방침).

## 테이블 권한(GRANT)

RLS는 행을 거르고, GRANT는 명령 자체를 허용한다. `public` 스키마의 default privileges가 새 테이블에 `anon`, `authenticated`, `service_role`의 모든 권한을 자동으로 주기 때문에, 마이그레이션의 `grant`만으로는 권한이 좁혀지지 않는다. `posts`는 `20261028133002_revoke_excess_posts_grants.sql`로 회수했다.

### D. posts GRANT 점검

```sql
select grantee, string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'posts'
  and grantee in ('anon', 'authenticated')
group by grantee order by grantee;
```

기대: `anon = SELECT`, `authenticated = DELETE, INSERT, SELECT, UPDATE`. `service_role`, `postgres`는 Supabase 기본값(전체)을 그대로 둔다.

### 알려진 한계

- default privileges는 바꾸지 않았다. 앞으로 `public`에 만드는 새 테이블은 다시 모든 권한을 받으므로, 테이블을 추가하는 마이그레이션에는 RLS와 함께 `revoke`를 넣고 점검 D를 돌린다.
- 회수 전 상태(2026-10-28 조회)는 anon이 `INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`, authenticated가 `TRUNCATE, REFERENCES, TRIGGER`를 추가로 갖고 있었다. RLS가 쓰기를 막고 PostgREST가 `TRUNCATE`를 노출하지 않아 실질 위험은 낮았다.
