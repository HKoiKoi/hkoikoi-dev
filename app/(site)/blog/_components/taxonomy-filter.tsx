import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buildBlogHref, type ListParams } from "@/lib/posts/list-params";
import { splitTopTags, type Taxonomy } from "@/lib/posts/taxonomy";

// 태그 칩 줄에 바로 보여 주는 태그 수 (글 수 기준 상위, 나머지는 '전체 태그')
const VISIBLE_TAG_LIMIT = 12;

interface TaxonomyFilterProps {
  taxonomy: Taxonomy;
  current: ListParams;
}

interface ChipProps {
  name: string;
  count: number;
  selected: boolean;
  href: string;
  prefix?: string;
}

// 필터 칩: 링크만으로 적용·해제되고(JavaScript 불필요), 선택된 칩은 해제 링크가 된다.
function Chip({ name, count, selected, href, prefix = "" }: ChipProps) {
  return (
    <li>
      <Badge
        variant={selected ? "default" : "outline"}
        className="h-7 max-w-full px-3 text-sm"
        render={
          <Link href={href} aria-current={selected ? "true" : undefined} />
        }
      >
        {prefix}
        {name}
        <span aria-hidden="true" className="text-xs tabular-nums opacity-70">
          {count}
        </span>
        <span className="sr-only">글 {count}개</span>
      </Badge>
    </li>
  );
}

function ChipRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
      <span className="w-14 shrink-0 pt-1 text-sm text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

const LIST_CLASS = "flex flex-wrap gap-2";

// /blog 상단의 카테고리·태그 칩 목록 (글 수 포함). 집계가 비면(조회 실패 포함) 렌더링하지 않는다.
export function TaxonomyFilter({ taxonomy, current }: TaxonomyFilterProps) {
  const { categories, tags } = taxonomy;
  if (categories.length === 0 && tags.length === 0) return null;

  const { visible, rest } = splitTopTags(tags, current.tag, VISIBLE_TAG_LIMIT);

  const tagChip = (name: string, count: number) => {
    const selected = current.tag === name;
    return (
      <Chip
        key={name}
        name={name}
        count={count}
        prefix="#"
        selected={selected}
        href={buildBlogHref(current, { tag: selected ? undefined : name })}
      />
    );
  };

  return (
    <nav aria-label="글 탐색" className="flex flex-col gap-3 pb-6">
      {categories.length > 0 && (
        <ChipRow label="카테고리">
          <ul className={LIST_CLASS}>
            {categories.map(({ name, count }) => {
              const selected = current.category === name;
              return (
                <Chip
                  key={name}
                  name={name}
                  count={count}
                  selected={selected}
                  href={buildBlogHref(current, {
                    category: selected ? undefined : name,
                  })}
                />
              );
            })}
          </ul>
        </ChipRow>
      )}
      {tags.length > 0 && (
        <ChipRow label="태그">
          <ul className={LIST_CLASS}>
            {visible.map(({ name, count }) => tagChip(name, count))}
          </ul>
          {rest.length > 0 && (
            <details className="group">
              <summary className="w-fit cursor-pointer rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                전체 태그 ({rest.length})
              </summary>
              <ul className={`${LIST_CLASS} pt-2`}>
                {rest.map(({ name, count }) => tagChip(name, count))}
              </ul>
            </details>
          )}
        </ChipRow>
      )}
    </nav>
  );
}
