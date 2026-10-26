import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PostTable } from "@/app/admin/posts/_components/post-table";
import { dummyPosts } from "@/lib/dummy/posts";

export default function AdminPostsPage() {
  // 관리자는 초안 포함 전체 글을 최신 수정순으로 본다.
  const posts = [...dummyPosts].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at),
  );

  return (
    <main className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">글 관리</h1>
        <Link href="/admin/posts/edit" className={buttonVariants()}>
          새 글
        </Link>
      </div>
      <PostTable posts={posts} />
    </main>
  );
}
