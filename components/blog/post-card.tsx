import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { CategoryBadge } from "@/components/blog/category-badge";
import { TagBadge } from "@/components/blog/tag-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/format-date";
import type { PostSummary } from "@/lib/types/post";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostSummary;
  className?: string;
}

// 블로그 목록 카드 (썸네일·제목·요약·카테고리·태그·날짜)
export function PostCard({ post, className }: PostCardProps) {
  const { slug, title, excerpt, thumbnail_url, category, tags } = post;
  const date = post.published_at ?? post.created_at;
  const href = `/blog/${encodeURIComponent(slug)}`;

  return (
    <Card className={cn("h-full", className)}>
      {thumbnail_url ? (
        // 외부 URL이 임의 도메인일 수 있어 next/image 대신 img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail_url}
          alt=""
          loading="lazy"
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground"
        >
          <ImageIcon className="size-8" />
        </div>
      )}
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={category} />
          <time dateTime={date} className="text-xs text-muted-foreground">
            {formatDate(date)}
          </time>
        </div>
        <CardTitle className="text-lg break-words">
          <Link href={href} className="hover:underline">
            {title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-3 break-words">
          {excerpt}
        </CardDescription>
      </CardHeader>
      {tags.length > 0 && (
        <CardContent>
          <ul className="flex flex-wrap gap-1.5" aria-label="태그">
            {tags.map((tag) => (
              <li key={tag}>
                <TagBadge tag={tag} />
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
