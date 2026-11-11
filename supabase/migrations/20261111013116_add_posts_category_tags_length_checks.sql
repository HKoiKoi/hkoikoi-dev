-- posts 길이 제약 보강: category 길이, tags 요소 길이
-- 기존 행 위반 없음을 사전 조회로 확인함(category 위반 0건, tags 요소 50자 초과 0건)

-- tags 요소 길이 검증 헬퍼
-- check 제약에는 서브쿼리를 쓸 수 없어 함수로 감싼다.
-- immutable + search_path 고정 + 완전 수식 이름 사용(SECURITY INVOKER 기본값 유지).
-- 빈 배열은 true를 반환한다.
create function public.tags_elements_within_length(tags text[], max_length integer)
returns boolean
language sql
immutable
parallel safe
security invoker
set search_path = ''
as $$
  select coalesce(
    pg_catalog.bool_and(pg_catalog.char_length(t) <= max_length),
    true
  )
  from pg_catalog.unnest(tags) as t
$$;

comment on function public.tags_elements_within_length(text[], integer)
  is 'posts.tags의 모든 요소가 max_length자 이하인지 검사한다(check 제약용 순수 함수).';

-- 서버(zod) 검증과 동일한 길이: category 1~50자, tags 요소 50자 이하
alter table public.posts
  add constraint posts_category_length_check
    check (char_length(category) between 1 and 50),
  add constraint posts_tags_element_length_check
    check (public.tags_elements_within_length(tags, 50));
