"use client";

import { useRouter } from "next/navigation";

import { buildBlogHref } from "@/lib/posts/list-params";
import type { Taxonomy } from "@/lib/posts/taxonomy";
import { cn } from "@/lib/utils";

interface CategorySelectProps {
  categories: Taxonomy["categories"];
  /** 현재 선택된 카테고리. 없으면 '전체' */
  category?: string;
}

const SELECT_CLASS =
  "h-8 min-w-0 max-w-40 rounded-lg border border-input bg-transparent px-2 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30 dark:[&>option]:bg-background";

// 카테고리 선택. 바꾸면 곧바로 이동하고(검색창에 입력 중인 검색어와 태그는 유지),
// JavaScript가 없으면 검색 버튼으로 함께 제출된다. '전체'는 category 조건을 뺀다.
export function CategorySelect({ categories, category }: CategorySelectProps) {
  const router = useRouter();
  // 집계에 없는 카테고리(URL 직접 입력)도 선택값이 비지 않게 옵션에 넣는다.
  const known = categories.some(({ name }) => name === category);

  return (
    <select
      key={category ?? ""}
      name="category"
      aria-label="카테고리"
      defaultValue={category ?? ""}
      className={cn(SELECT_CLASS)}
      onChange={(event) => {
        const form = event.currentTarget.form;
        const q = form?.querySelector<HTMLInputElement>('input[name="q"]');
        const tag = form?.querySelector<HTMLInputElement>('input[name="tag"]');
        router.push(
          buildBlogHref(
            { tag: tag?.value || undefined, q: q?.value.trim() || undefined },
            { category: event.currentTarget.value || undefined },
          ),
        );
      }}
    >
      <option value="">전체</option>
      {category && !known && <option value={category}>{category}</option>}
      {categories.map(({ name, count }) => (
        <option key={name} value={name}>
          {name} ({count})
        </option>
      ))}
    </select>
  );
}
