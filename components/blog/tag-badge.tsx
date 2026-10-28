import Link from "next/link";

import { TechBadge } from "@/components/content/tech-badge";

interface TagBadgeProps {
  tag: string;
  className?: string;
}

// 태그 배지: TechBadge 스타일에 클릭 시 태그 필터 목록으로 이동하는 링크
export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <TechBadge className={className}>
      <Link
        href={`/blog?tag=${encodeURIComponent(tag)}`}
        className="rounded-full outline-none after:absolute after:inset-0 after:z-30 after:rounded-full after:content-[''] focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
      >
        #{tag}
      </Link>
    </TechBadge>
  );
}
