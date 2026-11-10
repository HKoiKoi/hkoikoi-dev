// /blog 목록의 URL 상태(?category=&tag=&q=&page=)를 파싱하고 링크를 만드는 유틸.
// 필터·페이지 상태는 전부 URL에 두어 JavaScript 없이 링크만으로 적용·해제된다.

// DB 제약(category·tag 요소 1~50자)과 맞춘다.
const MAX_PARAM_LENGTH = 50;

// 임의의 큰 page마다 캐시 항목이 생기지 않도록 상한을 둔다. 넘으면 상한으로 고정한다.
const MAX_PAGE = 10000;

// 검색어는 DB 제약이 없어 category·tag처럼 무시하지 않고 50자로 자른다.
const MAX_Q_LENGTH = 50;
const MIN_Q_LENGTH = 2;

export interface ListParams {
  category?: string;
  tag?: string;
  /** 검색어. 2자 이상일 때만 설정된다(trim·NFC·50자 자름 적용) */
  q?: string;
  /** 검색어가 1자라 검색하지 않았음을 뜻한다. 이때 q는 없다 */
  qTooShort?: true;
  /** qTooShort일 때 입력창에 되살릴 원문 */
  rawQ?: string;
  /** 2 이상일 때만 설정된다. 없으면 1페이지 */
  page?: number;
}

type SearchParamsInput = Record<string, string | string[] | undefined>;

const FILTER_KEYS = ["category", "tag", "q"] as const;

// category·tag처럼 문자열 값으로 그대로 읽는 키. q는 별도 규칙(parseQ)을 쓴다.
const PARAM_KEYS = ["category", "tag"] as const;

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

function parseQ(
  value: string | string[] | undefined,
): Pick<ListParams, "q" | "qTooShort" | "rawQ"> {
  const raw = firstValue(value)?.trim().normalize("NFC");
  if (!raw) return {};
  const q = raw.slice(0, MAX_Q_LENGTH);
  if (q.length < MIN_Q_LENGTH) return { qTooShort: true, rawQ: q };
  return { q };
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
  for (const key of PARAM_KEYS) {
    const value = normalizeParam(searchParams[key]);
    if (value !== undefined) params[key] = value;
  }
  Object.assign(params, parseQ(searchParams.q));
  const page = parsePage(searchParams.page);
  if (page !== undefined) params.page = page;
  return params;
}

type BlogHrefPatch = {
  category?: string | undefined;
  tag?: string | undefined;
  q?: string | undefined;
  page?: number | undefined;
};

// patch에 키가 있고 값이 undefined이면 해제, 값이 있으면 설정, 키가 없으면 현재 조건을 유지한다.
// 필터(category·tag·q)가 patch에 들어 있으면 결과가 달라지므로 page는 버려 1페이지로 돌아간다.
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
