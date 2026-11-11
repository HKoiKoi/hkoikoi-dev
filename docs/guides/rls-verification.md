# RLS 검증 절차

`posts`·`resume_entries`·`projects`·`publications` 테이블과 `blog-images` 스토리지의 RLS가 의도대로인지 Supabase MCP `execute_sql`로 점검하는 절차다. 기본은 읽기 전용이고, 쓰기 거부는 항상 롤백되는 점검 E로만 확인한다. e2e는 실제 DB와 일반 로그인 계정이 필요한데 회원가입이 막혀 있고(관리자 1인), CI의 `e2e-smoke`는 placeholder Supabase 값이라 RLS를 검증하지 못한다. 그래서 정책을 바꾸는 마이그레이션을 적용한 직후에 이 절차를 수동으로 돌린다.

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

기대: `user_metadata_refs = 0`, `storage_select_policies = 1`(관리자 전용 `blog_images_select_admin`), `total_policies = 8`(posts 4개, blog-images 4개). 정책을 추가·삭제했다면 총 개수 기대값도 함께 고친다.

이력 3개 테이블(`resume_entries`, `projects`, `publications`)은 테이블마다 정책이 4개(select·insert·update·delete)다.

```sql
select count(*) filter (where qual ilike '%user_metadata%' or with_check ilike '%user_metadata%') as user_metadata_refs,
       count(*) filter (where cmd = 'SELECT') as select_policies,
       count(*) as total_policies
from pg_policies
where schemaname = 'public'
  and tablename in ('resume_entries', 'projects', 'publications');
```

기대: `user_metadata_refs = 0`, `select_policies = 3`, `total_policies = 12`.

## 검증 대상과 근거

| 대상                                 | 점검                                      | 근거                                                                                                                                                                                   |
| ------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 비로그인은 `published = true`만 조회 | A, 정책 `posts_select_published_or_admin` | anon에 적용되는 정책은 SELECT 하나이고 admin 식은 anon JWT에서 거짓                                                                                                                    |
| 일반 로그인 사용자는 쓰기 불가       | C(정책 정의), 쓰기 거부는 아래 한계 참고  | insert/update/delete 정책이 모두 `app_metadata.role = 'admin'`을 요구                                                                                                                  |
| `user_metadata`로 권한 상승 불가     | B, C                                      | 정책 8개 모두 `auth.jwt() -> 'app_metadata'`만 참조                                                                                                                                    |
| `blog-images` select는 관리자 전용   | B, C                                      | `storage.objects`의 SELECT 정책은 `authenticated` + `app_metadata.role = 'admin'` 1개뿐이라 anon·위조 사용자는 목록을 못 얻는다(B의 `objs = 0`). 공개 URL은 select 정책 없이 접근 가능 |

## 검증 대상(이력 3개 테이블)

| 대상                                         | 점검                     | 근거                                                                                               |
| -------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------- |
| 비로그인은 `is_visible = true`만 조회        | E(anon_hidden_select), C | SELECT 정책은 `is_visible = true` 또는 관리자 하나이고 admin 식은 anon JWT에서 거짓                |
| 비로그인 쓰기 불가                           | E(anon_insert), D'       | anon에는 SELECT만 GRANT되어 INSERT가 권한 오류(`42501`)                                            |
| `user_metadata` 위조로 권한 상승 불가        | E(forged_*), C           | 정책 12개 모두 `auth.jwt() -> 'app_metadata'`만 참조. 위조 사용자는 insert 거부, update·delete 0행 |
| 관리자(`app_metadata.role = 'admin'`)만 쓰기 | E(admin_*)               | 숨김 행 조회, insert, update, delete가 모두 허용                                                   |

## 한계

- 초안 행이 DB에 없으면 A, B의 `drafts = 0`은 "차단됨"과 "원래 없음"을 구분하지 못한다. 정책 정의 점검(C)이 본질이고 A, B는 보조 증거다.
- 쓰기 거부(일반 사용자 insert/update/delete)는 읽기 전용 트랜잭션으로 증명할 수 없다. 이력 3개 테이블은 점검 E처럼 DO 블록 안에서 시험 행을 넣고 마지막에 `raise exception`으로 끝내 전체를 롤백하는 방식으로 확인한다(정상 종료 경로가 없어 데이터가 남지 않는다). Task 017 이월 항목에도 `blog-images` INSERT 거부를 같은 방식으로 확인한 기록이 있다(ROADMAP 참고). 정책을 바꿀 때만 사용자 확인 후 수동으로 쓴다.
- `set_config('request.jwt.claims')`는 PostgREST가 JWT를 풀어 넣는 경로와 같지만 서명 검증 단계는 포함하지 않는다. 실제 비관리자 계정으로 로그인한 세션 검증은 하지 않는다(관리자 1명만 두는 방침).

## 테이블 권한(GRANT)

RLS는 행을 거르고, GRANT는 명령 자체를 허용한다. `public` 스키마의 default privileges가 새 테이블에 `anon`, `authenticated`, `service_role`의 모든 권한을 자동으로 주기 때문에, 마이그레이션의 `grant`만으로는 권한이 좁혀지지 않는다. `posts`는 `20261111013117_revoke_excess_posts_grants.sql`로 회수했다.

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

### D'. 이력 3개 테이블 GRANT 점검

```sql
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privs
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('resume_entries', 'projects', 'publications')
  and grantee in ('anon', 'authenticated')
group by table_name, grantee order by table_name, grantee;
```

기대: 테이블마다 `anon = SELECT`, `authenticated = DELETE, INSERT, SELECT, UPDATE`. 마이그레이션(`20261111044710_create_resume_tables.sql`)이 `revoke all` 뒤 필요한 권한만 `grant`한다.

## E. 쓰기 거부 점검(롤백되는 DO 블록)

운영 DB에 쓰기를 시도하므로 사용자 확인 뒤에 돌린다. 블록 안에서 (1) `postgres` 권한으로 공개·숨김 시험 행을 넣고, (2) `set local role`과 `request.jwt.claims`로 anon, `user_metadata`만 admin인 위조 사용자, `app_metadata` admin 사용자를 차례로 흉내 내 조회·insert·update·delete 결과를 문자열에 모은 뒤, (3) `raise exception`으로 끝내 모두 롤백한다. 결과는 오류 메시지의 `ROLLBACK_RESULT` 아래에 나온다. 테이블이 비어 있는 상태가 아니어도 시험 행은 `rls-` 접두로 구분되며 어떤 경우에도 커밋되지 않는다.

점검 골격(테이블 하나, 나머지는 테이블명과 필수 컬럼만 바꾼다):

```sql
do $$
declare r text := ''; n bigint; rc bigint;
begin
  insert into public.resume_entries(section, title, is_visible)
    values ('career', 'rls-1', true), ('career', 'rls-2', false);

  -- anon
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.resume_entries where is_visible = false;
  r := r || 'anon_hidden_select=' || n || E'\n';
  begin
    insert into public.resume_entries(section, title) values ('career', 'rls-anon');
    r := r || 'anon_insert=ALLOWED(!)' || E'\n';
  exception when others then
    r := r || 'anon_insert=DENIED ' || sqlstate || E'\n';
  end;
  reset role;

  -- user_metadata만 admin인 위조 사용자
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000001","app_metadata":{"role":"user"},"user_metadata":{"role":"admin"}}', true);
  set local role authenticated;
  begin
    insert into public.resume_entries(section, title) values ('career', 'rls-forged');
    r := r || 'forged_insert=ALLOWED(!)' || E'\n';
  exception when others then
    r := r || 'forged_insert=DENIED ' || sqlstate || E'\n';
  end;
  update public.resume_entries set sort_order = 99 where is_visible = true;
  get diagnostics rc = row_count;
  r := r || 'forged_update_rows=' || rc || E'\n';
  reset role;

  -- app_metadata admin
  perform set_config('request.jwt.claims',
    '{"role":"authenticated","sub":"00000000-0000-0000-0000-000000000002","app_metadata":{"role":"admin"}}', true);
  set local role authenticated;
  select count(*) into n from public.resume_entries where is_visible = false;
  r := r || 'admin_hidden_select=' || n || E'\n';
  insert into public.resume_entries(section, title) values ('career', 'rls-admin');
  reset role;

  raise exception E'ROLLBACK_RESULT\n%', r;   -- 항상 롤백
end $$;
```

기대값:

| 항목                                       | 기대                    |
| ------------------------------------------ | ----------------------- |
| `anon_hidden_select`                       | 0                       |
| `anon_visible_select`                      | 1                       |
| `anon_insert`                              | `DENIED 42501`          |
| `forged_insert`                            | `DENIED 42501`          |
| `forged_hidden_select`                     | 0                       |
| `forged_update_rows`, `forged_delete_rows` | 0                       |
| `admin_hidden_select`                      | 1                       |
| `admin_insert`                             | `ALLOWED`               |
| `admin_update_rows`                        | 2(공개 1 + 방금 넣은 1) |
| `admin_delete_rows`                        | 1(숨김 행)              |

종료 뒤 세 테이블의 행 수가 점검 전과 같은지(롤백 확인)도 조회한다.

### 실행 기록

- 2026-11-11, `main PRODUCTION`, Task 032: 세 테이블 모두 위 기대값과 일치했고 종료 뒤 세 테이블 행 수 0, 정책 점검 C(이력 3개 테이블) `user_metadata_refs = 0`, `select_policies = 3`, `total_policies = 12`, GRANT 점검 D'는 기대와 같음.
