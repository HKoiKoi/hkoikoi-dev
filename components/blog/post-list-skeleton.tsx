import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PostListSkeletonProps {
  count?: number;
}

// 블로그 목록 로딩 스켈레톤 (PostList·PostCard와 같은 그리드·카드 구조)
export function PostListSkeleton({ count = 4 }: PostListSkeletonProps) {
  return (
    <div role="status">
      <span className="sr-only">불러오는 중</span>
      <ul aria-hidden="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <Card className="h-full pt-0">
              <Skeleton className="aspect-video w-full rounded-none" />
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="mt-1 h-7 w-3/4" />
                <div className="mt-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardHeader>
              <CardContent className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
