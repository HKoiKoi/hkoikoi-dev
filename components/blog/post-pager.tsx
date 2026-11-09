import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Post } from "@/lib/types/post";
import { cn } from "@/lib/utils";

type PagerPost = Pick<Post, "slug" | "title">;

interface PostPagerProps {
  prev: PagerPost | null;
  next: PagerPost | null;
  className?: string;
}

/*
 * 블로그 상세 하단의 이전·다음 글 내비게이션.
 * 이전 = 더 오래된 글, 다음 = 더 최근 글이다. 정렬 기준은 목록과 같은
 * published_at desc이고 동률은 id로 가른다(lib/queries/posts.ts의 getAdjacentPosts).
 * 한쪽이 없으면 빈 칸을 남겨 다른 쪽이 제자리(이전은 왼쪽, 다음은 오른쪽)에 있게 한다.
 */
export function PostPager({ prev, next, className }: PostPagerProps) {
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="이전·다음 글"
      className={cn("grid gap-3 sm:grid-cols-2", className)}
    >
      {prev && (
        <PagerLink
          post={prev}
          label="이전 글"
          direction="prev"
          className="sm:col-start-1"
        />
      )}
      {next && (
        <PagerLink
          post={next}
          label="다음 글"
          direction="next"
          className="sm:col-start-2"
        />
      )}
    </nav>
  );
}

interface PagerLinkProps {
  post: PagerPost;
  label: string;
  direction: "prev" | "next";
  className?: string;
}

function PagerLink({ post, label, direction, className }: PagerLinkProps) {
  const isNext = direction === "next";
  const Icon = isNext ? ChevronRight : ChevronLeft;

  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-xl border border-border p-4 transition-colors outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring",
        isNext && "items-end text-right",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        {!isNext && <Icon aria-hidden="true" className="size-3.5" />}
        {label}
        {isNext && <Icon aria-hidden="true" className="size-3.5" />}
      </span>
      <span className="line-clamp-2 font-medium break-words">{post.title}</span>
    </Link>
  );
}
