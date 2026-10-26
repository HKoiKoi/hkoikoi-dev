import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

// 카테고리 배지: 클릭 시 카테고리 필터 목록으로 이동
export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={className && cn(className)}
      render={<Link href={`/blog?category=${encodeURIComponent(category)}`} />}
    >
      {category}
    </Badge>
  );
}
