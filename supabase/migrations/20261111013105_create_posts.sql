-- posts 테이블 생성 (ROADMAP Task 005 설계 / Task 010 구현)
-- 순서: create table -> indexes -> function -> trigger -> enable RLS -> policies
-- 관리자 판별은 app_metadata.role = 'admin' 만 사용한다(사용자가 수정 가능한 메타데이터는 인가에 쓰지 않는다).

-- 1. 테이블
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  -- NFC 정규화된 값만 저장(한글 허용)
  slug text not null unique,
  title text not null,
  content text not null default '',
  excerpt text not null default '',
  thumbnail_url text,
  category text not null default '일반',
  tags text[] not null default '{}',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint posts_slug_nfc_check check (slug = normalize(slug, nfc)),
  constraint posts_title_length_check check (char_length(title) between 1 and 200),
  -- 서버 검증과 동일한 최대 길이(100,000자)
  constraint posts_content_length_check check (char_length(content) <= 100000),
  constraint posts_excerpt_length_check check (char_length(excerpt) <= 150),
  constraint posts_tags_cardinality_check check (cardinality(tags) <= 10),
  -- 공개 글은 반드시 published_at을 가져야 한다
  constraint posts_published_at_check check ((not published) or published_at is not null)
);

comment on table public.posts is '블로그 글. 공개 글은 누구나 읽고, 쓰기는 관리자만 가능하다.';

-- 2. 인덱스 (slug unique 인덱스는 제약조건이 자동 생성)
create index posts_published_published_at_idx
  on public.posts (published, published_at desc);
create index posts_tags_idx
  on public.posts using gin (tags);
create index posts_category_idx
  on public.posts (category);

-- 3. updated_at 갱신 함수 (SECURITY INVOKER, search_path 고정, 완전 수식 이름 사용)
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

-- 4. 트리거
create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_updated_at();

-- 5. RLS 활성화
alter table public.posts enable row level security;

-- 6. 정책
-- select: 공개 글은 누구나, 초안은 관리자만 (UPDATE/DELETE 대상 행 조회에도 필요)
create policy "posts_select_published_or_admin"
  on public.posts
  for select
  to anon, authenticated
  using (
    published = true
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- insert: 관리자만
create policy "posts_insert_admin"
  on public.posts
  for insert
  to authenticated
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- update: 관리자만 (using과 with check 모두 지정)
create policy "posts_update_admin"
  on public.posts
  for update
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- delete: 관리자만
create policy "posts_delete_admin"
  on public.posts
  for delete
  to authenticated
  using (
    ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 7. Data API 노출용 GRANT (행 단위 접근은 위 RLS 정책이 제어)
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
