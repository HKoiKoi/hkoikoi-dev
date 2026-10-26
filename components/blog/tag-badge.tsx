import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  tag: string;
  className?: string;
}

// 태그 배지: 클릭 시 태그 필터 목록으로 이동
export function TagBadge({ tag, className }: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={className && cn(className)}
      render={<Link href={`/blog?tag=${encodeURIComponent(tag)}`} />}
    >
      #{tag}
    </Badge>
  );
}
