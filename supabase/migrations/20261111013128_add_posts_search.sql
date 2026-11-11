-- 블로그 키워드 검색 (ROADMAP Task 025)
-- 제목·요약을 부분 일치(ilike)로 검색하고, 카테고리·태그 필터와 AND로 결합한다.
-- 본문(content)은 인덱스 비용 때문에 검색 대상에서 제외한다.
-- additive 변경만 포함한다(확장, 인덱스, 함수 추가).

-- 1. trigram 확장 (extensions 스키마에 설치)
create extension if not exists pg_trgm with schema extensions;

-- 2. ilike '%키워드%' 가속용 GIN trigram 인덱스
create index posts_title_trgm_idx
  on public.posts using gin (title extensions.gin_trgm_ops);
create index posts_excerpt_trgm_idx
  on public.posts using gin (excerpt extensions.gin_trgm_ops);

-- 3. 검색 결과 한 페이지 (목록 카드용 요약 컬럼만 반환, 본문 제외)
-- SECURITY INVOKER라 RLS가 그대로 적용되지만, 본문에서도 published = true를 강제한다.
-- q의 백슬래시·%·_ 는 이스케이프해 문자 그대로 검색한다. 모든 객체는 스키마를 명시한다.
create function public.search_published_posts(
  q text,
  p_category text default null,
  p_tag text default null,
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  id uuid,
  slug text,
  title text,
  excerpt text,
  thumbnail_url text,
  category text,
  tags text[],
  published boolean,
  published_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id, p.slug, p.title, p.excerpt, p.thumbnail_url, p.category, p.tags,
    p.published, p.published_at, p.created_at, p.updated_at
  from public.posts p
  where p.published = true
    and (
      p.title ilike '%' || replace(replace(replace(coalesce(q, ''), chr(92), chr(92) || chr(92)), '%', chr(92) || '%'), '_', chr(92) || '_') || '%' escape '\'
      or p.excerpt ilike '%' || replace(replace(replace(coalesce(q, ''), chr(92), chr(92) || chr(92)), '%', chr(92) || '%'), '_', chr(92) || '_') || '%' escape '\'
    )
    and (nullif(p_category, '') is null or p.category = p_category)
    and (nullif(p_tag, '') is null or p.tags @> array[p_tag])
  order by p.published_at desc, p.id desc
  limit p_limit offset p_offset
$$;

-- 4. 같은 필터의 전체 건수 (페이지네이션용)
create function public.search_published_posts_count(
  q text,
  p_category text default null,
  p_tag text default null
)
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*)
  from public.posts p
  where p.published = true
    and (
      p.title ilike '%' || replace(replace(replace(coalesce(q, ''), chr(92), chr(92) || chr(92)), '%', chr(92) || '%'), '_', chr(92) || '_') || '%' escape '\'
      or p.excerpt ilike '%' || replace(replace(replace(coalesce(q, ''), chr(92), chr(92) || chr(92)), '%', chr(92) || '%'), '_', chr(92) || '_') || '%' escape '\'
    )
    and (nullif(p_category, '') is null or p.category = p_category)
    and (nullif(p_tag, '') is null or p.tags @> array[p_tag])
$$;

-- 5. 실행 권한: PUBLIC 기본 권한을 회수하고 anon, authenticated에만 부여
revoke execute on function public.search_published_posts(text, text, text, int, int) from public;
revoke execute on function public.search_published_posts_count(text, text, text) from public;
grant execute on function public.search_published_posts(text, text, text, int, int) to anon, authenticated;
grant execute on function public.search_published_posts_count(text, text, text) to anon, authenticated;
