// /blog 목록의 URL 상태(?category=&tag=)를 파싱하고 링크를 만드는 유틸.
// 필터 상태는 전부 URL에 두어 JavaScript 없이 링크만으로 적용·해제된다.

// DB 제약(category·tag 요소 1~50자)과 맞춘다.
const MAX_PARAM_LENGTH = 50;

export interface ListParams {
  category?: string;
  tag?: string;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

const PARAM_KEYS = ["category", "tag"] as const;

function normalizeParam(value: string | string[] | undefined) {
  // 같은 키가 여러 번 오면 첫 값을 사용한다.
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === undefined) return undefined;
  const normalized = raw.trim().normalize("NFC");
  if (normalized === "" || normalized.length > MAX_PARAM_LENGTH) {
    return undefined;
  }
  return normalized;
}

export function parseListParams(searchParams: SearchParamsInput): ListParams {
  const params: ListParams = {};
  for (const key of PARAM_KEYS) {
    const value = normalizeParam(searchParams[key]);
    if (value !== undefined) params[key] = value;
  }
  return params;
}

// patch에 키가 있고 값이 undefined이면 해제, 값이 있으면 설정, 키가 없으면 현재 조건을 유지한다.
// 결과가 비면 '/blog'를 돌려준다.
// Task 024(페이지네이션)에서 page를 추가할 때: 이 함수에서 category·tag가 바뀌면 page를 출력에서
// 빼서 1페이지로 돌아가게 하고, page만 바뀌는 patch는 필터를 그대로 유지한다.
export function buildBlogHref(
  current: ListParams,
  patch: Partial<Record<keyof ListParams, string | undefined>> = {},
): string {
  const query = new URLSearchParams();
  for (const key of PARAM_KEYS) {
    const value = key in patch ? patch[key] : current[key];
    if (value) query.set(key, value);
  }
  const search = query.toString();
  return search ? `/blog?${search}` : "/blog";
}
