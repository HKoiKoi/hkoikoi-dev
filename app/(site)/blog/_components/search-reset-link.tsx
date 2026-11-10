"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

interface SearchResetLinkProps {
  /** 모든 조건(검색어·카테고리·태그)을 푼 목록 주소 */
  href: string;
}

// 입력창에 타이핑만 해 둔 상태에서도 비워야 하므로, 이동 전에 q 입력값을 직접 지운다.
// JavaScript 없이도 href 이동은 동작한다.
export function SearchResetLink({ href }: SearchResetLinkProps) {
  return (
    <Link
      href={href}
      className={buttonVariants({ variant: "outline" })}
      onClick={(event) => {
        const input = event.currentTarget
          .closest("form")
          ?.querySelector<HTMLInputElement>('input[name="q"]');
        if (input) input.value = "";
      }}
    >
      초기화
    </Link>
  );
}
