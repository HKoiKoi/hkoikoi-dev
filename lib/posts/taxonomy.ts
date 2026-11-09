import { compareTagNames } from "@/lib/posts/sort-tags";

export type TaxonomyItem = { name: string; count: number };

export type Taxonomy = {
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
};

export const EMPTY_TAXONOMY: Taxonomy = { categories: [], tags: [] };

type TaxonomyRow = { category: string; tags: string[] };

function toSortedItems(counts: Map<string, number>): TaxonomyItem[] {
  return Array.from(counts, ([name, count]) => ({ name, count })).sort((a, b) =>
    compareTagNames(a.name, b.name),
  );
}

/**
 * 발행 글의 카테고리·태그별 글 수를 집계하고 이름을 태그 정렬 규칙으로 정렬한다.
 * 기본 카테고리 '일반'도 맨 앞에 고정하지 않고 규칙대로 정렬한다.
 * 한 글에 같은 태그가 중복돼 있어도 그 글은 한 번만 센다.
 */
export function countTaxonomy(rows: TaxonomyRow[]): Taxonomy {
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();

  for (const row of rows) {
    categories.set(row.category, (categories.get(row.category) ?? 0) + 1);
    for (const tag of new Set(row.tags)) {
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
  }

  return { categories: toSortedItems(categories), tags: toSortedItems(tags) };
}

/**
 * 태그 칩 줄에 보일 상위 태그와 나머지를 나눈다.
 * 글 수 내림차순(동률은 이름 규칙 순)으로 상위 limit개를 고르되 선택된 태그는 반드시 포함하고,
 * 두 묶음 모두 태그 정렬 규칙 순서로 돌려준다.
 */
export function splitTopTags(
  tags: TaxonomyItem[],
  selected: string | undefined,
  limit: number,
): { visible: TaxonomyItem[]; rest: TaxonomyItem[] } {
  const byCount = [...tags].sort(
    (a, b) => b.count - a.count || compareTagNames(a.name, b.name),
  );
  const top = byCount.slice(0, limit);

  const selectedItem = byCount.find((tag) => tag.name === selected);
  if (selectedItem && !top.includes(selectedItem) && limit > 0) {
    // 선택된 태그가 밀려났으면 가장 글 수가 적은 마지막 칸과 바꾼다.
    top[top.length - 1] = selectedItem;
  }

  const visibleNames = new Set(top.map((tag) => tag.name));
  const byName = (a: TaxonomyItem, b: TaxonomyItem) =>
    compareTagNames(a.name, b.name);
  return {
    visible: top.sort(byName),
    rest: byCount.filter((tag) => !visibleNames.has(tag.name)).sort(byName),
  };
}
