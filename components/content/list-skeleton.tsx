import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ListSkeletonProps {
  count?: number;
  /** 항목 배치. 프로젝트 카드는 2열 그리드, 이력·논문은 1열이다. */
  columns?: 1 | 2;
}

// 이력·프로젝트·논문 목록 로딩 스켈레톤
export function ListSkeleton({ count = 3, columns = 1 }: ListSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">불러오는 중</span>
      <ul
        aria-hidden="true"
        className={cn(
          "grid gap-4",
          columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        )}
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <Card className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="mt-1 h-4 w-3/4" />
                <Skeleton className="mt-1 h-4 w-1/3" />
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
