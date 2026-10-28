import { Suspense } from "react";
import { PostEditor } from "@/app/admin/posts/_components/post-editor";
import { requireAdmin } from "@/lib/auth/require-admin";

async function AdminPostNewContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">글 작성</h1>
      <PostEditor />
    </main>
  );
}

export default function AdminPostNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminPostNewContent />
    </Suspense>
  );
}
