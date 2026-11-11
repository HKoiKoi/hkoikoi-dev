-- 블로그 조회수 (ROADMAP Task 030)
-- 글별 누적 조회수를 post_views에 저장한다. 조회수 증가는 increment_post_view() RPC로만 가능하다.
-- 관리자 판별은 app_metadata.role = 'admin' 만 사용한다(user_metadata는 인가에 쓰지 않는다).

-- 1. 테이블 (글이 삭제되면 조회수 행도 함께 삭제)
create table public.post_views (
  post_id uuid primary key references public.posts (id) on delete cascade,
  view_count bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.post_views is '글별 누적 조회수. 읽기만 직접 허용하고, 증가는 increment_post_view()로만 가능하다.';

-- 2. RLS 활성화
alter table public.post_views enable row level security;

-- 3. 정책
-- select: 발행 글의 조회수는 누구나, 초안 글의 조회수는 관리자만
-- (posts의 기존 관리자 정책과 같은 표현을 쓴다)
create policy "post_views_select_published_or_admin"
  on public.post_views
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts p
      where p.id = post_views.post_id
        and p.published = true
    )
    or ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 4. 테이블 권한: select만 남긴다
-- public 스키마의 default privileges가 새 테이블에 모든 권한을 주므로 명시적으로 회수한다.
-- (insert/update/delete 정책이 없어 RLS도 막지만 권한 자체를 이중으로 차단한다)
revoke insert, update, delete, truncate, references, trigger on public.post_views from anon, authenticated;
grant select on public.post_views to anon, authenticated;

-- 5. 조회수 증가 함수
-- SECURITY DEFINER를 쓰는 이유: anon·authenticated에게 post_views 쓰기 권한을 주지 않고,
-- 쓰기 경로를 이 함수 하나로 제한하기 위해서다. 권한 오류를 피하려는 용도가 아니다.
-- 함수가 직접 발행 여부를 검사해 발행 글이 아니면 아무것도 쓰지 않고 false를 돌려준다.
-- search_path를 비우고 모든 객체의 스키마를 명시한다.
create function public.increment_post_view(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 발행 글이 아니거나 없는 글이면 쓰지 않는다
  if not exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.published = true
  ) then
    return false;
  end if;

  insert into public.post_views as pv (post_id, view_count, updated_at)
  values (p_post_id, 1, pg_catalog.now())
  on conflict (post_id) do update
    set view_count = pv.view_count + 1,
        updated_at = pg_catalog.now();

  return true;
end;
$$;

-- 6. 실행 권한: PUBLIC 기본 권한을 회수하고 anon, authenticated에만 부여
revoke execute on function public.increment_post_view(uuid) from public;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;
