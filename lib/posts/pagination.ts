// /blog 목록 페이지네이션의 순수 계산 함수. 오프셋 기반이며 DB·React에 의존하지 않는다.
// 페이지 크기는 기기에 따라 달라 호출하는 쪽이 넘긴다(lib/posts/page-size.ts).

// 번호를 전부 나열하는 최대 페이지 수. 이를 넘으면 처음·끝·현재 주변만 남기고 줄인다.
const MAX_FULL_ITEMS = 7;

export type PageItem = number | "ellipsis";

/** 전체 글 수로 계산한 총 페이지 수. 글이 없어도 1페이지(빈 목록 안내)로 본다 */
export function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Supabase `range(from, to)`에 넣는 0 기반 인덱스 범위(to 포함) */
export function getPageRange(
  page: number,
  pageSize: number,
): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

/**
 * 번호 링크 목록. 7페이지 이하면 전부, 넘으면 첫·끝 페이지와 현재 ±1만 두고
 * 건너뛴 구간에 'ellipsis'를 넣는다. 범위를 벗어난 current는 가장자리로 보정한다.
 */
export function getPageItems(current: number, totalPages: number): PageItem[] {
  if (totalPages <= MAX_FULL_ITEMS) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const page = Math.min(Math.max(current, 1), totalPages);
  const shown = [...new Set([1, page - 1, page, page + 1, totalPages])].filter(
    (n) => n >= 1 && n <= totalPages,
  );
  shown.sort((a, b) => a - b);

  const items: PageItem[] = [];
  shown.forEach((n, index) => {
    const previous = shown[index - 1];
    if (previous !== undefined && n - previous > 1) {
      // 한 페이지만 건너뛰면 생략 기호보다 번호가 짧다
      items.push(n - previous === 2 ? n - 1 : "ellipsis");
    }
    items.push(n);
  });
  return items;
}
