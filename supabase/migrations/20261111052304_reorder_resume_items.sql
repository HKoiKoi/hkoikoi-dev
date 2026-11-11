-- 이력·프로젝트 순서 변경 RPC (Task 033)
-- 순서: create function -> revoke/grant
-- security invoker: 호출자의 RLS가 그대로 적용된다(쓰기는 app_metadata.role = 'admin'만).
-- 관리자 화면에서 위/아래 이동 시 sort_order를 한 문장으로 재배치해 중간 상태가 노출되지 않게 한다.

-- 1. 섹션별 이력 순서 재배치. p_ids는 해당 섹션 전체 항목(숨김 포함)을 새 순서대로 담아야 한다.
create or replace function public.reorder_resume_entries(p_section text, p_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    raise exception 'p_ids must not be empty' using errcode = '22023';
  end if;
  if (select count(distinct i) from unnest(p_ids) as i) <> cardinality(p_ids) then
    raise exception 'p_ids must not contain duplicates or nulls' using errcode = '22023';
  end if;

  -- 같은 섹션의 동시 재배치를 직렬화해 행 잠금 순서 경합(데드락)을 피한다.
  perform pg_advisory_xact_lock(hashtextextended('reorder_resume_entries:' || coalesce(p_section, ''), 0));

  update public.resume_entries as e
  set sort_order = (o.ord * 10)::integer
  from unnest(p_ids) with ordinality as o(id, ord)
  where e.id = o.id
    and e.section = p_section;
  get diagnostics v_count = row_count;

  -- 목록이 오래됐거나(삭제·추가), 대상 섹션 밖 id가 섞였거나, 권한이 없어 RLS가 행을 가린 경우
  -- 일부만 갱신되지 않도록 전체를 되돌린다.
  if v_count <> cardinality(p_ids)
     or exists (
       select 1
       from public.resume_entries as e
       where e.section = p_section
         and e.id <> all (p_ids)
     ) then
    raise exception 'reorder mismatch' using errcode = '22023';
  end if;

  return v_count;
end;
$$;

comment on function public.reorder_resume_entries(text, uuid[])
  is '섹션 안 이력 항목의 sort_order를 p_ids 순서대로 10 단위로 재배치한다. 목록이 섹션 전체와 다르면 예외로 되돌린다.';

-- 2. 프로젝트 순서 재배치. p_ids는 전체 프로젝트(숨김 포함)를 새 순서대로 담아야 한다.
create or replace function public.reorder_projects(p_ids uuid[])
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_ids is null or cardinality(p_ids) = 0 then
    raise exception 'p_ids must not be empty' using errcode = '22023';
  end if;
  if (select count(distinct i) from unnest(p_ids) as i) <> cardinality(p_ids) then
    raise exception 'p_ids must not contain duplicates or nulls' using errcode = '22023';
  end if;

  -- 동시 재배치를 직렬화해 행 잠금 순서 경합(데드락)을 피한다.
  perform pg_advisory_xact_lock(hashtextextended('reorder_projects', 0));

  update public.projects as p
  set sort_order = (o.ord * 10)::integer
  from unnest(p_ids) with ordinality as o(id, ord)
  where p.id = o.id;
  get diagnostics v_count = row_count;

  if v_count <> cardinality(p_ids)
     or exists (
       select 1
       from public.projects as p
       where p.id <> all (p_ids)
     ) then
    raise exception 'reorder mismatch' using errcode = '22023';
  end if;

  return v_count;
end;
$$;

comment on function public.reorder_projects(uuid[])
  is '프로젝트 전체의 sort_order를 p_ids 순서대로 10 단위로 재배치한다. 목록이 전체와 다르면 예외로 되돌린다.';

-- 3. 실행 권한: 함수는 기본적으로 PUBLIC에 EXECUTE가 열리므로 회수하고 로그인 사용자에게만 준다.
revoke execute on function public.reorder_resume_entries(text, uuid[]) from public, anon;
revoke execute on function public.reorder_projects(uuid[]) from public, anon;

grant execute on function public.reorder_resume_entries(text, uuid[]) to authenticated;
grant execute on function public.reorder_projects(uuid[]) to authenticated;
