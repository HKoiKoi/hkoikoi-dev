import { compareTagNames } from "@/lib/posts/sort-tags";

type TaxonomyItem = { name: string; count: number };

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
