import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getPageRange } from "@/lib/posts/pagination";
import {
  countTaxonomy,
  EMPTY_TAXONOMY,
  type Taxonomy,
} from "@/lib/posts/taxonomy";
import { POST_COLUMNS, SUMMARY_COLUMNS } from "@/lib/queries/columns";
import { createPublicClient } from "@/lib/supabase/public";
import type { Post, PostSummary } from "@/lib/types/post";

type CacheResult<T> = { ok: true; data: T } | { ok: false; message: string };

/** 실패 결과는 캐시에 저장되지 않도록 수명을 0으로 만든다. */
function failUncached(message: string): { ok: false; message: string } {
  cacheLife({ stale: 0, revalidate: 0, expire: 0 });
  return { ok: false, message };
}

/*
 * 공개 글 조회는 'use cache'로 캐시하고 태그로만 무효화한다(posts, post:<slug>).
 * 캐시 함수 안에서 오류가 나면 throw하지 않고 실패 결과를 돌려주되 수명을 0으로 줄여
 * (프리렌더에서 빠지고 저장되지 않는다) 일시 오류가 캐시에 굳지 않게 한다. throw하면
 * 바깥에서 catch해도 Next가 프리렌더 오류로 보고 빌드가 실패한다.
 * 바깥 래퍼가 console.error 후 빈 값을 돌려준다. 쿠키를 읽는 server 클라이언트 대신
 * 세션 없는 public 클라이언트를 쓴다.
 */

type PostFilter = { category?: string; tag?: string };

/** 목록 한 페이지와 필터에 맞는 전체 글 수 */
export type PostsPage = { posts: PostSummary[]; total: number };

const EMPTY_PAGE: PostsPage = { posts: [], total: 0 };

// 전체 조회와 페이징 조회가 같은 필터를 쓰도록 한 곳에서 건다.
function applyPostFilter<
  Q extends {
    eq(column: "category", value: string): Q;
    contains(column: "tags", value: string[]): Q;
  },
>(query: Q, { category, tag }: PostFilter): Q {
  let filtered = query;
  if (category) filtered = filtered.eq("category", category);
  // tags는 text[]이므로 배열 포함 연산자로 비교한다.
  if (tag) filtered = filtered.contains("tags", [tag]);
  return filtered;
}

async function fetchLatestPosts(
  limit: number,
): Promise<CacheResult<PostSummary[]>> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    // RLS와 별개로 공개 글만 조회하도록 이중 방어한다.
    .eq("published", true)
    .order("published_at", { ascending: false })
    // 같은 시각 발행 글의 순서가 pager(인접 글)와 어긋나지 않게 id로 고정한다.
    .order("id", { ascending: false })
    .limit(limit);

  if (error) return failUncached(error.message);
  return { ok: true, data: data ?? [] };
}

/** 메인 페이지용 최신 공개 글 (본문 제외) */
export async function getLatestPosts(limit: number): Promise<PostSummary[]> {
  try {
    const result = await fetchLatestPosts(limit);
    if (result.ok) return result.data;
    console.error("[getLatestPosts]", result.message);
    return [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getLatestPosts]", error);
    return [];
  }
}

async function fetchPublishedPosts(
  category: string | undefined,
  tag: string | undefined,
): Promise<CacheResult<PostSummary[]>> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  const query = applyPostFilter(
    supabase.from("posts").select(SUMMARY_COLUMNS).eq("published", true),
    { category, tag },
  );

  const { data, error } = await query
    .order("published_at", { ascending: false })
    // 같은 시각 발행 글의 순서가 pager(인접 글)와 어긋나지 않게 id로 고정한다.
    .order("id", { ascending: false });

  if (error) return failUncached(error.message);
  return { ok: true, data: data ?? [] };
}

/** 블로그 목록용 공개 글 (본문 제외), 카테고리·태그로 필터링 */
export async function getPublishedPosts({
  category,
  tag,
}: PostFilter = {}): Promise<PostSummary[]> {
  try {
    const result = await fetchPublishedPosts(category, tag);
    if (result.ok) return result.data;
    console.error("[getPublishedPosts]", result.message);
    return [];
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPublishedPosts]", error);
    return [];
  }
}

/*
 * 페이지 번호와 크기(기기별 6·10)가 인자라 (category, tag, page, pageSize)마다 캐시 항목이 따로 생기고,
 * 무효화는 'posts' 태그 하나로 한다.
 * 정렬에 id 보조 정렬을 두어 페이지 경계에서 같은 발행 시각의 글이 중복되거나 빠지지 않게 한다.
 * 글 수보다 큰 offset은 PostgREST가 416(PGRST103)로 거절하고 count도 주지 않는다. 이때는 오류로 보지 않고
 * head 요청으로 전체 글 수만 다시 세어 빈 목록과 함께 돌려준다(페이지 컴포넌트가 안내를 보여 준다).
 */
async function fetchPublishedPostsPage(
  category: string | undefined,
  tag: string | undefined,
  page: number,
  pageSize: number,
): Promise<CacheResult<PostsPage>> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  const filter = { category, tag };
  const { from, to } = getPageRange(page, pageSize);

  const { data, count, error } = await applyPostFilter(
    supabase
      .from("posts")
      .select(SUMMARY_COLUMNS, { count: "exact" })
      .eq("published", true),
    filter,
  )
    .order("published_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error?.code === "PGRST103") {
    const counted = await applyPostFilter(
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("published", true),
      filter,
    );
    if (counted.error) return failUncached(counted.error.message);
    return { ok: true, data: { posts: [], total: counted.count ?? 0 } };
  }
  if (error) return failUncached(error.message);
  return { ok: true, data: { posts: data ?? [], total: count ?? 0 } };
}

/** 블로그 목록의 한 페이지(본문 제외)와 전체 글 수. 오류면 빈 목록과 0 */
export async function getPublishedPostsPage({
  category,
  tag,
  page = 1,
  pageSize,
}: PostFilter & { page?: number; pageSize: number }): Promise<PostsPage> {
  try {
    const result = await fetchPublishedPostsPage(category, tag, page, pageSize);
    if (result.ok) return result.data;
    console.error("[getPublishedPostsPage]", result.message);
    return EMPTY_PAGE;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPublishedPostsPage]", error);
    return EMPTY_PAGE;
  }
}

/*
 * 검색은 'use cache'를 쓰지 않는다. 캐시 키가 인자(q 포함)의 직렬화이고 검색어 공간이 사실상
 * 무한이라 항목이 끝없이 쌓인다(node_modules/next/dist/docs의 use-cache 문서: 키 = 직렬화된 인자).
 * 대신 요청 시점에 RPC로 조회한다(호출 측이 Suspense 안에서 await). 필터·이스케이프·published = true는
 * RPC(search_published_posts)가 강제하므로 PostgREST 필터 문자열에 사용자 입력을 넣지 않는다.
 * 행 조회와 총 건수 조회는 병렬로 하며, 글 수보다 큰 offset은 RPC가 빈 행을 돌려줄 뿐 오류가 아니라서
 * (PGRST103 처리 불필요) count 결과로 total만 채운다.
 */
export async function searchPosts({
  q,
  category,
  tag,
  page = 1,
  pageSize,
}: PostFilter & {
  q: string;
  page?: number;
  pageSize: number;
}): Promise<PostsPage> {
  try {
    const supabase = createPublicClient();
    const { from } = getPageRange(page, pageSize);
    const filter = { q, p_category: category, p_tag: tag };

    const [rows, count] = await Promise.all([
      supabase.rpc("search_published_posts", {
        ...filter,
        p_limit: pageSize,
        p_offset: from,
      }),
      supabase.rpc("search_published_posts_count", filter),
    ]);

    if (rows.error || count.error) {
      console.error(
        "[searchPosts]",
        (rows.error ?? count.error)?.message ?? "unknown",
      );
      return EMPTY_PAGE;
    }
    // bigint는 문자열로 올 수 있어 숫자로 바꾼다.
    return { posts: rows.data ?? [], total: Number(count.data ?? 0) };
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[searchPosts]", error);
    return EMPTY_PAGE;
  }
}

/*
 * 카테고리·태그 목록은 발행 글의 category, tags 두 컬럼만 읽어 앱에서 집계한다.
 * 집계 결과(직렬화 가능한 평범한 객체)를 캐시하고 'posts' 태그로 무효화한다.
 * 발행 글이 수백 건을 넘어 집계 비용이 문제 되면 집계 RPC로 바꾼다(ROADMAP Task 023).
 */
async function fetchTaxonomy(): Promise<CacheResult<Taxonomy>> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select("category, tags")
    .eq("published", true);

  if (error) return failUncached(error.message);
  return { ok: true, data: countTaxonomy(data ?? []) };
}

/** 블로그 목록 상단용 카테고리·태그별 글 수. 오류면 빈 목록 */
export async function getTaxonomy(): Promise<Taxonomy> {
  try {
    const result = await fetchTaxonomy();
    if (result.ok) return result.data;
    console.error("[getTaxonomy]", result.message);
    return EMPTY_TAXONOMY;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getTaxonomy]", error);
    return EMPTY_TAXONOMY;
  }
}

async function fetchPostBySlug(
  slug: string,
): Promise<CacheResult<Post | null>> {
  "use cache";
  cacheTag("posts", `post:${slug}`);
  cacheLife("max");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) return failUncached(error.message);
  return { ok: true, data };
}

/** 이전·다음 글 링크용 최소 정보 */
type AdjacentPost = Pick<Post, "slug" | "title">;

export type AdjacentPosts = {
  /** 더 오래된 글 */
  prev: AdjacentPost | null;
  /** 더 최근 글 */
  next: AdjacentPost | null;
};

const EMPTY_ADJACENT: AdjacentPosts = { prev: null, next: null };

/*
 * 인접 글은 목록과 같은 정렬(published_at desc, 동률은 id desc)을 기준으로 한다.
 * 무효화는 'posts' 태그 하나로 충분하다. 글 저장·삭제·발행 변경은 invalidatePostTags가
 * updateTag('posts')를 호출하고, 인접 글 조회도 같은 'posts' 태그를 달기 때문에
 * 이웃 글의 제목 수정·삭제·초안 전환이 모든 상세 페이지의 pager에 즉시 반영된다.
 * publishedAt·id는 DB에서 온 timestamptz·uuid라 or 필터 문자열에 그대로 넣어도 안전하다
 * (PostgREST에서 '+', ':'가 든 값이 인용 없이 동작함을 확인했다).
 */
async function fetchAdjacentPosts(
  publishedAt: string,
  id: string,
): Promise<CacheResult<AdjacentPosts>> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  const [older, newer] = await Promise.all([
    supabase
      .from("posts")
      .select("slug, title")
      .eq("published", true)
      .or(
        `published_at.lt.${publishedAt},and(published_at.eq.${publishedAt},id.lt.${id})`,
      )
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1),
    supabase
      .from("posts")
      .select("slug, title")
      .eq("published", true)
      .or(
        `published_at.gt.${publishedAt},and(published_at.eq.${publishedAt},id.gt.${id})`,
      )
      .order("published_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(1),
  ]);

  if (older.error) return failUncached(older.error.message);
  if (newer.error) return failUncached(newer.error.message);
  return {
    ok: true,
    data: { prev: older.data?.[0] ?? null, next: newer.data?.[0] ?? null },
  };
}

/** 이전(더 오래된)·다음(더 최근) 공개 글. 없거나 오류면 해당 쪽이 null */
export async function getAdjacentPosts(
  publishedAt: string | null,
  id: string,
): Promise<AdjacentPosts> {
  // 발행 시각이 없으면 비교 기준이 없다.
  if (!publishedAt) return EMPTY_ADJACENT;

  try {
    const result = await fetchAdjacentPosts(publishedAt, id);
    if (result.ok) return result.data;
    console.error("[getAdjacentPosts]", result.message);
    return EMPTY_ADJACENT;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getAdjacentPosts]", error);
    return EMPTY_ADJACENT;
  }
}

/** slug로 공개 글 하나 조회. 없거나 오류면 null */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    // DB에 NFC로 저장되므로 URL에서 온 NFD 한글 slug를 맞춘다(캐시 키·태그도 NFC로 통일).
    const result = await fetchPostBySlug(slug.normalize("NFC"));
    if (result.ok) return result.data;
    console.error("[getPostBySlug]", result.message);
    return null;
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPostBySlug]", error);
    return null;
  }
}
