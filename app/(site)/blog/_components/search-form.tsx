import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ListParams } from "@/lib/posts/list-params";
import type { Taxonomy } from "@/lib/posts/taxonomy";

import { CategorySelect } from "./category-select";

import { SearchResetLink } from "./search-reset-link";

interface SearchFormProps {
  current: ListParams;
  /** 카테고리 선택 목록 (글 수 포함) */
  categories?: Taxonomy["categories"];
  /** 검색 결과 전체 건수. 검색 중일 때만 넘긴다 */
  total?: number;
}

// 블로그 검색 폼. JavaScript 없이 GET 제출로 동작하는 서버 컴포넌트다.
// 카테고리는 select로 고르고 tag는 hidden으로 유지하며, page는 넣지 않아 검색하면 1페이지로 돌아간다.
export function SearchForm({
  current,
  total,
  categories = [],
}: SearchFormProps) {
  const { category, tag, q, qTooShort, rawQ } = current;

  return (
    <div className="flex flex-col gap-2 pb-6">
      <form action="/blog" method="get" role="search" className="flex gap-2">
        <Label htmlFor="blog-search" className="sr-only">
          블로그 검색
        </Label>
        <Input
          key={q ?? rawQ ?? ""}
          id="blog-search"
          type="search"
          name="q"
          defaultValue={q ?? rawQ ?? ""}
          maxLength={50}
          placeholder="제목·소개글 검색"
          autoComplete="off"
          aria-describedby={qTooShort ? "blog-search-hint" : undefined}
        />
        <CategorySelect categories={categories} category={category} />
        {tag && <input type="hidden" name="tag" value={tag} />}
        <SearchResetLink href="/blog" />
        <Button type="submit">검색</Button>
      </form>
      {qTooShort && (
        <p id="blog-search-hint" role="status" className="text-sm">
          검색어는 두 글자 이상 입력해 주세요.
        </p>
      )}
      {q && (
        <p role="status" className="text-sm text-muted-foreground">
          <span className="break-all">&lsquo;{q}&rsquo;</span> 검색 결과{" "}
          {total ?? 0}개
        </p>
      )}
    </div>
  );
}
