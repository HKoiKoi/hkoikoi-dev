import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildBlogHref, type ListParams } from "@/lib/posts/list-params";

interface SearchFormProps {
  current: ListParams;
  /** 검색 결과 전체 건수. 검색 중일 때만 넘긴다 */
  total?: number;
}

// 블로그 검색 폼. JavaScript 없이 GET 제출로 동작하는 서버 컴포넌트다.
// category·tag는 hidden으로 유지하고 page는 넣지 않아 검색하면 1페이지로 돌아간다.
export function SearchForm({ current, total }: SearchFormProps) {
  const { category, tag, q, qTooShort, rawQ } = current;

  return (
    <div className="flex flex-col gap-2 pb-6">
      <form action="/blog" method="get" role="search" className="flex gap-2">
        <Label htmlFor="blog-search" className="sr-only">
          블로그 검색
        </Label>
        <Input
          id="blog-search"
          type="search"
          name="q"
          defaultValue={q ?? rawQ ?? ""}
          maxLength={50}
          placeholder="제목·소개글 검색"
          autoComplete="off"
          aria-describedby={qTooShort ? "blog-search-hint" : undefined}
        />
        {category && <input type="hidden" name="category" value={category} />}
        {tag && <input type="hidden" name="tag" value={tag} />}
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
          <Link
            href={buildBlogHref(current, { q: undefined })}
            className="ml-3 underline underline-offset-4 hover:text-foreground"
          >
            검색어 지우기
          </Link>
        </p>
      )}
    </div>
  );
}
