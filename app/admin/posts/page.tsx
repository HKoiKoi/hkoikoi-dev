import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { PostTable } from "@/app/admin/posts/_components/post-table";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { PostSummary } from "@/lib/types/post";

export default function AdminPostsPage() {
  return (
    <Suspense fallback={null}>
      <AdminPostsContent />
    </Suspense>
  );
}

async function AdminPostsContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  // TODO: Task 013에서 초안 포함 전체 글을 최신 수정순으로 조회한다(lib/queries/admin-posts.ts).
  const posts: PostSummary[] = [];

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
