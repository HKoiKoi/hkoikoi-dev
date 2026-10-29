import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { POST_COLUMNS, SUMMARY_COLUMNS } from "@/lib/queries/columns";
import { createPublicClient } from "@/lib/supabase/public";
import type { Post, PostSummary } from "@/lib/types/post";

/*
 * 공개 글 조회는 'use cache'로 캐시하고 태그로만 무효화한다(posts, post:<slug>).
 * 캐시 함수 안에서는 오류를 throw해 일시 오류가 캐시에 굳지 않게 하고,
 * 바깥 래퍼가 console.error 후 빈 값을 돌려준다. 쿠키를 읽는 server 클라이언트 대신
 * 세션 없는 public 클라이언트를 쓴다.
 */

type PostFilter = { category?: string; tag?: string };

async function fetchLatestPosts(limit: number): Promise<PostSummary[]> {
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
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 메인 페이지용 최신 공개 글 (본문 제외) */
export async function getLatestPosts(limit: number): Promise<PostSummary[]> {
  try {
    return await fetchLatestPosts(limit);
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
): Promise<PostSummary[]> {
  "use cache";
  cacheTag("posts");
  cacheLife("max");

  const supabase = createPublicClient();
  let query = supabase
    .from("posts")
    .select(SUMMARY_COLUMNS)
    .eq("published", true);

  if (category) query = query.eq("category", category);
  // tags는 text[]이므로 배열 포함 연산자로 비교한다.
  if (tag) query = query.contains("tags", [tag]);

  const { data, error } = await query.order("published_at", {
    ascending: false,
  });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** 블로그 목록용 공개 글 (본문 제외), 카테고리·태그로 필터링 */
export async function getPublishedPosts({
  category,
  tag,
}: PostFilter = {}): Promise<PostSummary[]> {
  try {
    return await fetchPublishedPosts(category, tag);
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPublishedPosts]", error);
    return [];
  }
}

async function fetchPostBySlug(slug: string): Promise<Post | null> {
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

  if (error) throw new Error(error.message);
  return data;
}

/** slug로 공개 글 하나 조회. 없거나 오류면 null */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    // DB에 NFC로 저장되므로 URL에서 온 NFD 한글 slug를 맞춘다(캐시 키·태그도 NFC로 통일).
    return await fetchPostBySlug(slug.normalize("NFC"));
  } catch (error) {
    // 프리렌더 중단 같은 Next.js 내부 신호는 삼키지 않고 다시 던진다.
    unstable_rethrow(error);
    console.error("[getPostBySlug]", error);
    return null;
  }
}
