import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buildBlogHref } from "@/lib/posts/list-params";

interface PostFilterBarProps {
  category?: string;
  tag?: string;
  /** 검색어. 필터를 해제해도 유지한다 */
  q?: string;
}

// 현재 적용된 필터 배지와 '필터 해제' 링크 (필터가 없으면 렌더링하지 않음)
export function PostFilterBar({ category, tag, q }: PostFilterBarProps) {
  if (!category && !tag) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <span className="text-sm text-muted-foreground">현재 필터</span>
      {category && <Badge variant="secondary">카테고리: {category}</Badge>}
      {tag && <Badge variant="outline">태그: #{tag}</Badge>}
      <Link
        href={buildBlogHref(
          { category, tag, q },
          { category: undefined, tag: undefined },
        )}
        className="text-sm underline underline-offset-4 hover:text-foreground"
      >
        필터 해제
      </Link>
    </div>
  );
}
