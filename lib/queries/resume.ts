import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { sortPublications } from "@/lib/publications/sort";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  Project,
  ProjectRow,
  Publication,
  PublicationRow,
  ResumeEntry,
  ResumeEntryRow,
  ResumeSection,
} from "@/lib/types/resume";

type CacheResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** 실패 결과는 캐시에 저장되지 않도록 수명을 0으로 만든다. */
function failUncached(message: string): { ok: false; message: string } {
  cacheLife({ stale: 0, revalidate: 0, expire: 0 });
  return { ok: false, message };
}

/*
 * 이력·프로젝트·논문 공개 조회도 posts와 같은 규칙을 따른다: 'use cache' + 태그 무효화,
 * 캐시 안에서는 throw하지 않고 실패 결과를 돌려주며(수명 0), 바깥 래퍼가 console.error 후 빈 배열을 돌려준다.
 * 태그는 resume(전체)·resume:<section>, projects, publications다.
 * 숨김 항목은 RLS가 막지만 쿼리에도 is_visible = true를 명시해 이중 방어한다.
 */

const RESUME_COLUMNS =
  "title, subtitle, period, description, grade, grade_label, tags, tag_groups, link";
const PROJECT_COLUMNS =
  "name, summary, period, role, stack, github_url, demo_url, featured";
const PUBLICATION_COLUMNS = "title, authors, venue, year, link";

type ResumeEntryColumns = Pick<
  ResumeEntryRow,
  | "title"
  | "subtitle"
  | "period"
  | "description"
  | "grade"
  | "grade_label"
  | "tags"
  | "tag_groups"
  | "link"
>;
type ProjectColumns = Pick<
  ProjectRow,
  | "name"
  | "summary"
  | "period"
  | "role"
  | "stack"
  | "github_url"
  | "demo_url"
  | "featured"
>;
type PublicationColumns = Pick<
  PublicationRow,
  "title" | "authors" | "venue" | "year" | "link"
>;

// jsonb는 형태를 보장하지 않으므로 [{ label, tags[] }]가 아닌 값은 버린다.
function toTagGroups(value: unknown): ResumeEntry["tagGroups"] {
  if (!Array.isArray(value)) return undefined;
  const groups = value.flatMap((item) => {
    if (typeof item !== "object" || item === null) return [];
    const { label, tags } = item as { label?: unknown; tags?: unknown };
    if (typeof label !== "string" || !Array.isArray(tags)) return [];
    return [
      {
        label,
        tags: tags.filter((tag): tag is string => typeof tag === "string"),
      },
    ];
  });
  return groups.length > 0 ? groups : undefined;
}

// DB의 null·빈 배열은 기존 data 모양처럼 "없음(undefined)"으로 바꾼다.
function toResumeEntry(row: ResumeEntryColumns): ResumeEntry {
  return {
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    period: row.period ?? undefined,
    description: row.description ?? undefined,
    grade: row.grade ?? undefined,
    gradeLabel: row.grade_label ?? undefined,
    tags: row.tags.length > 0 ? row.tags : undefined,
    tagGroups: toTagGroups(row.tag_groups),
    link: row.link ?? undefined,
  };
}

function toProject(row: ProjectColumns): Project {
  return {
    name: row.name,
    summary: row.summary,
    period: row.period,
    role: row.role,
    stack: row.stack,
    links: {
      ...(row.github_url ? { github: row.github_url } : {}),
      ...(row.demo_url ? { demo: row.demo_url } : {}),
    },
    ...(row.featured ? { featured: true } : {}),
  };
}

function toPublication(row: PublicationColumns): Publication {
  return {
    title: row.title,
    authors: row.authors,
    venue: row.venue,
    year: row.year,
    link: row.link ?? undefined,
  };
}

async function fetchResumeEntries(
  section: ResumeSection,
): Promise<CacheResult<ResumeEntry[]>> {
  "use cache";
  cacheTag("resume", `resume:${section}`);
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("resume_entries")
    .select(RESUME_COLUMNS)
    .eq("section", section)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    // sort_order가 같아도 순서가 흔들리지 않게 id로 고정한다.
    .order("id", { ascending: true });

  if (error) return failUncached(error.message);
  return { ok: true, data: (data ?? []).map(toResumeEntry) };
}

/** 섹션별 이력 항목(공개만, sort_order 오름차순) */
export async function getResumeEntries(
  section: ResumeSection,
): Promise<ResumeEntry[]> {
  try {
    const result = await fetchResumeEntries(section);
    if (result.ok) return result.data;
    console.error("[getResumeEntries]", section, result.message);
    return [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getResumeEntries]", section, error);
    return [];
  }
}

async function fetchProjects(): Promise<CacheResult<Project[]>> {
  "use cache";
  cacheTag("projects");
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) return failUncached(error.message);
  return { ok: true, data: (data ?? []).map(toProject) };
}

/** 프로젝트 목록(공개만, sort_order 오름차순). 메인 대표 선정은 호출 측이 selectFeatured로 한다. */
export async function getProjects(): Promise<Project[]> {
  try {
    const result = await fetchProjects();
    if (result.ok) return result.data;
    console.error("[getProjects]", result.message);
    return [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("[getProjects]", error);
    return [];
  }
}

async function fetchPublications(): Promise<CacheResult<Publication[]>> {
  "use cache";
  cacheTag("publications");
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("publications")
    .select(PUBLICATION_COLUMNS)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) return failUncached(error.message);
  // 연도 내림차순, 같은 연도는 sort_order(조회 순서)를 따른다(정렬은 안정 정렬).
  return { ok: true, data: sortPublications((data ?? []).map(toPublication)) };
}

/** 논문 목록(공개만, 연도 내림차순·같은 연도는 sort_order 순) */
export async function getPublications(): Promise<Publication[]> {
  try {
    const result = await fetchPublications();
    if (result.ok) return result.data;
    console.error("[getPublications]", result.message);
    return [];
  } catch (error) {
    unstable_rethrow(error);
    console.error("[getPublications]", error);
    return [];
  }
}
