import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { buildBlogHref, type ListParams } from "@/lib/posts/list-params";
import { getPageItems } from "@/lib/posts/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  current: ListParams;
  page: number;
  totalPages: number;
}

const NAV_BUTTON = "min-w-16";

// /blog 목록 하단 페이지 내비게이션. 링크만으로 동작하며 모바일에서는 번호 목록 대신 "현재 / 전체"를 보여 준다.
export function Pagination({ current, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (n: number) => buildBlogHref(current, { page: n });
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <nav
      aria-label="페이지"
      className="flex items-center justify-between gap-2 pt-8 sm:justify-center"
    >
      {hasPrev ? (
        <Link
          href={href(page - 1)}
          aria-label="이전 페이지"
          className={cn(buttonVariants({ variant: "outline" }), NAV_BUTTON)}
        >
          <ChevronLeft aria-hidden="true" data-icon="inline-start" />
          이전
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "outline" }),
            NAV_BUTTON,
            "opacity-50",
          )}
        >
          <ChevronLeft aria-hidden="true" data-icon="inline-start" />
          이전<span className="sr-only"> 페이지</span>
        </span>
      )}

      <p className="text-sm text-muted-foreground tabular-nums sm:hidden">
        <span aria-hidden="true">
          {page} / {totalPages}
        </span>
        <span className="sr-only">
          {totalPages}페이지 중 {page}페이지
        </span>
      </p>

      <ul className="hidden items-center gap-1 sm:flex">
        {getPageItems(page, totalPages).map((item, index) =>
          item === "ellipsis" ? (
            <li
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="flex size-8 items-center justify-center text-sm text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={href(item)}
                aria-label={`${item}페이지`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: item === page ? "default" : "ghost",
                  }),
                  "min-w-8 tabular-nums",
                )}
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ul>

      {hasNext ? (
        <Link
          href={href(page + 1)}
          aria-label="다음 페이지"
          className={cn(buttonVariants({ variant: "outline" }), NAV_BUTTON)}
        >
          다음
          <ChevronRight aria-hidden="true" data-icon="inline-end" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className={cn(
            buttonVariants({ variant: "outline" }),
            NAV_BUTTON,
            "opacity-50",
          )}
        >
          다음<span className="sr-only"> 페이지</span>
          <ChevronRight aria-hidden="true" data-icon="inline-end" />
        </span>
      )}
    </nav>
  );
}
