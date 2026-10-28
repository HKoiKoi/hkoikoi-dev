import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeletePostDialog } from "@/app/admin/posts/_components/delete-post-dialog";
import { formatDate } from "@/lib/format-date";
import type { PostSummary } from "@/lib/types/post";

export function PostTable({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        작성된 글이 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-xl text-left text-sm">
        <caption className="sr-only">글 목록</caption>
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              제목
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              상태
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              카테고리
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              수정일
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              관리
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {posts.map((post) => (
            <tr key={post.id}>
              <th
                scope="row"
                className="px-4 py-3 font-medium whitespace-nowrap"
              >
                {post.title}
              </th>
              <td className="px-4 py-3">
                {/* 초안은 outline, 발행은 default로 구분한다. */}
                <Badge variant={post.published ? "default" : "outline"}>
                  {post.published ? "발행" : "초안"}
                </Badge>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">{post.category}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDate(post.updated_at)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                  >
                    수정
                  </Link>
                  <DeletePostDialog postId={post.id} postTitle={post.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
