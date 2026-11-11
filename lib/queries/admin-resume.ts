import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type {
  ProjectRow,
  PublicationRow,
  ResumeEntryRow,
  ResumeSection,
} from "@/lib/types/resume";

/*
 * 관리자 이력·프로젝트·논문 조회. 캐시하지 않고 세션 쿠키 기반 서버 클라이언트를 쓴다.
 * is_visible 필터를 걸지 않아 숨김 항목도 돌려주므로(숨김 행은 RLS가 관리자에게만 허용한다)
 * 반드시 호출 측이 requireAdmin() 이후에 사용한다.
 * 오류는 unstable_rethrow로 Next.js 내부 신호를 먼저 다시 던지고, 나머지는 console.error 후
 * 목록은 빈 배열, 단건은 null로 돌려준다.
 */

type QueryResult<T> = { data: T | null; error: { message: string } | null };

async function run<T>(
  label: string,
  fallback: T,
  query: () => PromiseLike<QueryResult<T>>,
): Promise<T> {
  try {
    const { data, error } = await query();
    if (error) {
      console.error(`[${label}]`, error.message);
      return fallback;
    }
    return data ?? fallback;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error(`[${label}]`, error);
    return fallback;
  }
}

// 잘못된 id는 DB까지 가지 않고 막는다 (uuid 컬럼 비교 오류 방지).
const isUuid = (id: string) => z.uuid().safeParse(id).success;

/** 섹션별 이력 목록: sort_order 오름차순, 동률은 id로 고정한다. 숨김 포함. */
export async function getAdminResumeEntries(
  section: ResumeSection,
): Promise<ResumeEntryRow[]> {
  return run<ResumeEntryRow[]>("getAdminResumeEntries", [], async () => {
    const supabase = await createClient();
    return supabase
      .from("resume_entries")
      .select("*")
      .eq("section", section)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  });
}

/** id로 이력 항목 하나 조회(숨김 포함). uuid가 아니거나 없거나 오류면 null. */
export async function getAdminResumeEntry(
  id: string,
): Promise<ResumeEntryRow | null> {
  if (!isUuid(id)) return null;
  return run<ResumeEntryRow | null>("getAdminResumeEntry", null, async () => {
    const supabase = await createClient();
    return supabase
      .from("resume_entries")
      .select("*")
      .eq("id", id)
      .maybeSingle();
  });
}

/** 프로젝트 목록: sort_order 오름차순, 동률은 id. 숨김 포함. */
export async function getAdminProjects(): Promise<ProjectRow[]> {
  return run<ProjectRow[]>("getAdminProjects", [], async () => {
    const supabase = await createClient();
    return supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  });
}

/** id로 프로젝트 하나 조회(숨김 포함). uuid가 아니거나 없거나 오류면 null. */
export async function getAdminProject(id: string): Promise<ProjectRow | null> {
  if (!isUuid(id)) return null;
  return run<ProjectRow | null>("getAdminProject", null, async () => {
    const supabase = await createClient();
    return supabase.from("projects").select("*").eq("id", id).maybeSingle();
  });
}

/** 논문 목록: 공개 화면과 같은 year 내림차순, 같은 해는 sort_order 오름차순(동률은 id). 숨김 포함. */
export async function getAdminPublications(): Promise<PublicationRow[]> {
  return run<PublicationRow[]>("getAdminPublications", [], async () => {
    const supabase = await createClient();
    return supabase
      .from("publications")
      .select("*")
      .order("year", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
  });
}

/** id로 논문 하나 조회(숨김 포함). uuid가 아니거나 없거나 오류면 null. */
export async function getAdminPublication(
  id: string,
): Promise<PublicationRow | null> {
  if (!isUuid(id)) return null;
  return run<PublicationRow | null>("getAdminPublication", null, async () => {
    const supabase = await createClient();
    return supabase.from("publications").select("*").eq("id", id).maybeSingle();
  });
}
