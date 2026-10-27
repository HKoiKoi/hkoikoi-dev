import { Suspense } from "react";
import { PostEditor } from "@/app/admin/posts/edit/_components/post-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

export default function AdminPostEditPage() {
  return (
    <Suspense fallback={null}>
      <AdminPostEditContent />
    </Suspense>
  );
}

async function AdminPostEditContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">글 작성</h1>
      <PostEditor />
    </main>
  );
}
