// 글이 참조하는 blog-images 객체 경로를 모은다 (순수 함수, Supabase·Next 비의존).
//
// 반환하는 경로는 버킷 기준 상대 경로(YYYY/MM/<uuid>.<ext>)다. 이 형식은
// lib/storage/validate-image.ts의 buildImagePath가 만든다. 여기서는 형식을 검사하지 않고
// "공개 URL 접두 뒤의 경로"만 꺼낸다. 형식 검증은 삭제 쪽(Server Action)이 맡는다.
//
// supabaseUrl과 같은 호스트의 URL만 센다. 다른 버킷이나 외부 도메인의 같은 모양 경로는
// 이 프로젝트의 객체가 아니므로 제외한다.

const PUBLIC_PREFIX = "/storage/v1/object/public/blog-images/";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    // 잘못된 % 시퀀스는 원문 그대로 둔다 (참조로 세어 삭제 쪽에서 보호한다).
    return value;
  }
}

/**
 * 마크다운 이미지·링크와 raw HTML(`<img src>`)에 들어 있는 blog-images 공개 URL에서
 * 버킷 상대 경로를 추출한다. 쿼리스트링·해시는 버리고 퍼센트 인코딩은 풀어 쓴다.
 */
export function extractImagePaths(
  content: string,
  supabaseUrl: string,
): Set<string> {
  const paths = new Set<string>();
  if (!content || !supabaseUrl) return paths;

  const base = supabaseUrl.replace(/\/+$/, "");
  // 경로는 공백·따옴표·괄호·꺾쇠·?·# 앞에서 끝난다 (마크다운 `(url "제목")`, HTML 속성, 쿼리 대응).
  const pattern = new RegExp(
    `${escapeRegExp(base + PUBLIC_PREFIX)}([^\\s"'()<>?#]+)`,
    "g",
  );

  for (const match of content.matchAll(pattern)) {
    const path = safeDecode(match[1]);
    if (path) paths.add(path);
  }
  return paths;
}

/** 모든 글(초안 포함)의 본문과 썸네일이 참조하는 경로의 합집합. */
export function collectReferencedPaths(
  posts: ReadonlyArray<{ content: string; thumbnail_url: string | null }>,
  supabaseUrl: string,
): Set<string> {
  const referenced = new Set<string>();
  for (const post of posts) {
    for (const path of extractImagePaths(post.content, supabaseUrl)) {
      referenced.add(path);
    }
    if (post.thumbnail_url) {
      for (const path of extractImagePaths(post.thumbnail_url, supabaseUrl)) {
        referenced.add(path);
      }
    }
  }
  return referenced;
}
