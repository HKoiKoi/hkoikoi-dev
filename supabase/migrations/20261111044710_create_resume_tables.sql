-- 이력·프로젝트·논문 테이블 생성 (ROADMAP Task 032)
-- data/*.ts 정적 데이터를 DB로 옮겨 코드 배포 없이 내용을 바꿀 기반을 만든다.
-- 순서: create table -> indexes -> trigger -> enable RLS -> policies -> grant/revoke
-- 관리자 판별은 app_metadata.role = 'admin' 만 사용한다(user_metadata는 사용자가 수정할 수 있어 인가에 쓰지 않는다).
-- updated_at 함수 public.set_updated_at()은 create_posts 마이그레이션에서 만든 것을 재사용한다.
-- 길이 상한은 Task 033에서 만들 zod 스키마와 같은 값으로 맞춘다.

-- 1. resume_entries: 학력·경력·자격증·사회봉사·어학·사회활동 공통 항목
create table public.resume_entries (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  title text not null,
  subtitle text,
  period text,
  description text,
  -- 카드 오른쪽 하단에 강조해 표시하는 수치(예: 학점 "3.87 / 4.5")
  grade text,
  -- grade를 스크린리더에 읽어 줄 이름. 없으면 화면에서 "평점"을 쓴다
  grade_label text,
  tags text[] not null default '{}',
  -- 영역별 기술 스택: [{"label": "개발", "tags": ["Next.js", ...]}, ...]
  tag_groups jsonb not null default '[]'::jsonb,
  link text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint resume_entries_section_check
    check (section in ('education', 'career', 'certifications', 'volunteer', 'languages', 'activities')),
  constraint resume_entries_title_length_check check (char_length(title) between 1 and 200),
  constraint resume_entries_subtitle_length_check check (char_length(subtitle) <= 200),
  constraint resume_entries_period_length_check check (char_length(period) <= 100),
  constraint resume_entries_description_length_check check (char_length(description) <= 2000),
  constraint resume_entries_grade_length_check check (char_length(grade) <= 50),
  constraint resume_entries_grade_label_length_check check (char_length(grade_label) <= 50),
  constraint resume_entries_tags_cardinality_check check (cardinality(tags) <= 20),
  constraint resume_entries_tags_element_length_check
    check (public.tags_elements_within_length(tags, 50)),
  constraint resume_entries_tag_groups_check
    check (jsonb_typeof(tag_groups) = 'array' and jsonb_array_length(tag_groups) <= 10),
  constraint resume_entries_link_check
    check (link is null or (char_length(link) <= 500 and link ~ '^https://')),
  constraint resume_entries_sort_order_check check (sort_order >= 0)
);

comment on table public.resume_entries is '학력·경력·자격증·사회봉사·어학·사회활동 항목. 공개 항목은 누구나 읽고, 쓰기는 관리자만 가능하다.';

-- 2. projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  summary text not null default '',
  period text not null default '',
  role text not null default '',
  stack text[] not null default '{}',
  github_url text,
  demo_url text,
  -- 메인 대표 프로젝트 표시 여부(featured가 3개 미만이면 목록 앞에서부터 채운다)
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint projects_name_length_check check (char_length(name) between 1 and 200),
  constraint projects_summary_length_check check (char_length(summary) <= 1000),
  constraint projects_period_length_check check (char_length(period) <= 100),
  constraint projects_role_length_check check (char_length(role) <= 100),
  constraint projects_stack_cardinality_check check (cardinality(stack) <= 20),
  constraint projects_stack_element_length_check
    check (public.tags_elements_within_length(stack, 50)),
  constraint projects_github_url_check
    check (github_url is null or (char_length(github_url) <= 500 and github_url ~ '^https://')),
  constraint projects_demo_url_check
    check (demo_url is null or (char_length(demo_url) <= 500 and demo_url ~ '^https://')),
  constraint projects_sort_order_check check (sort_order >= 0)
);

comment on table public.projects is '프로젝트. 공개 항목은 누구나 읽고, 쓰기는 관리자만 가능하다.';

-- 3. publications
create table public.publications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text not null default '',
  venue text not null default '',
  year integer not null,
  -- 공개된 게재 페이지 주소. 없으면 제목을 링크 없이 표시한다
  link text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint publications_title_length_check check (char_length(title) between 1 and 500),
  constraint publications_authors_length_check check (char_length(authors) <= 500),
  constraint publications_venue_length_check check (char_length(venue) <= 500),
  constraint publications_year_check check (year between 1900 and 2100),
  constraint publications_link_check
    check (link is null or (char_length(link) <= 500 and link ~ '^https://')),
  constraint publications_sort_order_check check (sort_order >= 0)
);

comment on table public.publications is '논문. 공개 항목은 누구나 읽고, 쓰기는 관리자만 가능하다.';

-- 4. 인덱스: 섹션별 목록을 sort_order 순으로 읽는다
create index resume_entries_section_sort_order_idx
  on public.resume_entries (section, sort_order);
create index projects_sort_order_idx
  on public.projects (sort_order);
create index publications_sort_order_idx
  on public.publications (sort_order);

-- 5. updated_at 트리거 (함수는 posts와 공용)
create trigger resume_entries_set_updated_at
  before update on public.resume_entries
  for each row
  execute function public.set_updated_at();

create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

create trigger publications_set_updated_at
  before update on public.publications
  for each row
  execute function public.set_updated_at();

-- 6. RLS 활성화
alter table public.resume_entries enable row level security;
alter table public.projects enable row level security;
alter table public.publications enable row level security;

-- 7. 정책 (테이블마다 select / insert / update / delete)
-- select: 공개 항목은 누구나, 숨김 항목은 관리자만 (편집 화면과 UPDATE/DELETE 대상 행 조회에 필요)
create policy "resume_entries_select_visible_or_admin"
  on public.resume_entries
  for select
  to anon, authenticated
  using (
    is_visible = true
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "resume_entries_insert_admin"
  on public.resume_entries
  for insert
  to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "resume_entries_update_admin"
  on public.resume_entries
  for update
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "resume_entries_delete_admin"
  on public.resume_entries
  for delete
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "projects_select_visible_or_admin"
  on public.projects
  for select
  to anon, authenticated
  using (
    is_visible = true
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "projects_insert_admin"
  on public.projects
  for insert
  to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "projects_update_admin"
  on public.projects
  for update
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "projects_delete_admin"
  on public.projects
  for delete
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "publications_select_visible_or_admin"
  on public.publications
  for select
  to anon, authenticated
  using (
    is_visible = true
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "publications_insert_admin"
  on public.publications
  for insert
  to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "publications_update_admin"
  on public.publications
  for update
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

create policy "publications_delete_admin"
  on public.publications
  for delete
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 8. GRANT: anon은 select만, authenticated는 select/insert/update/delete만 남긴다.
-- public 스키마의 default privileges가 새 테이블에 모든 권한을 주므로 명시적으로 회수한다.
-- 행 단위 접근은 위 RLS 정책이 제어한다.
revoke all on public.resume_entries from anon, authenticated;
revoke all on public.projects from anon, authenticated;
revoke all on public.publications from anon, authenticated;

grant select on public.resume_entries to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.publications to anon, authenticated;

grant insert, update, delete on public.resume_entries to authenticated;
grant insert, update, delete on public.projects to authenticated;
grant insert, update, delete on public.publications to authenticated;
