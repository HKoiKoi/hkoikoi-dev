// /blog 목록의 URL 상태(?category=&tag=&page=)를 파싱하고 링크를 만드는 유틸.
// 필터·페이지 상태는 전부 URL에 두어 JavaScript 없이 링크만으로 적용·해제된다.

// DB 제약(category·tag 요소 1~50자)과 맞춘다.
const MAX_PARAM_LENGTH = 50;

// 임의의 큰 page마다 캐시 항목이 생기지 않도록 상한을 둔다. 넘으면 상한으로 고정한다.
const MAX_PAGE = 10000;

export interface ListParams {
  category?: string;
  tag?: string;
  /** 2 이상일 때만 설정된다. 없으면 1페이지 */
  page?: number;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ["category", "tag"] as const;

// 같은 키가 여러 번 오면 첫 값을 사용한다.
function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeParam(value: string | string[] | undefined) {
  const raw = firstValue(value);
  if (raw === undefined) return undefined;
  const normalized = raw.trim().normalize("NFC");
  if (normalized === "" || normalized.length > MAX_PARAM_LENGTH) {
    return undefined;
  }
  return normalized;
}

// 양의 정수 문자열만 받는다. 1페이지(기본값)와 잘못된 값은 undefined로 돌려 1페이지로 본다.
function parsePage(value: string | string[] | undefined) {
  const raw = firstValue(value)?.trim();
  if (raw === undefined || !/^\d+$/.test(raw)) return undefined;
  const page = Math.min(Number(raw), MAX_PAGE);
  return page > 1 ? page : undefined;
}

export function parseListParams(searchParams: SearchParamsInput): ListParams {
  const params: ListParams = {};
  for (const key of FILTER_KEYS) {
    const value = normalizeParam(searchParams[key]);
    if (value !== undefined) params[key] = value;
  }
  const page = parsePage(searchParams.page);
  if (page !== undefined) params.page = page;
  return params;
}

type BlogHrefPatch = {
  category?: string | undefined;
  tag?: string | undefined;
  page?: number | undefined;
};

// patch에 키가 있고 값이 undefined이면 해제, 값이 있으면 설정, 키가 없으면 현재 조건을 유지한다.
// 필터(category·tag)가 patch에 들어 있으면 결과가 달라지므로 page는 버려 1페이지로 돌아간다.
// page만 바뀌는 patch는 필터를 그대로 유지한다. 1페이지는 쿼리에 쓰지 않는다.
// 결과가 비면 '/blog'를 돌려준다.
export function buildBlogHref(
  current: ListParams,
  patch: BlogHrefPatch = {},
): string {
  const query = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = key in patch ? patch[key] : current[key];
    if (value) query.set(key, value);
  }

  const filterChanged = FILTER_KEYS.some((key) => key in patch);
  const page =
    "page" in patch ? patch.page : filterChanged ? undefined : current.page;
  if (page !== undefined && page > 1) query.set("page", String(page));

  const search = query.toString();
  return search ? `/blog?${search}` : "/blog";
}
