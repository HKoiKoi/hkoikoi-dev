import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/app/admin/posts/_components/post-editor";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPostById } from "@/lib/queries/admin-posts";

// params는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function AdminPostEditContent({
  params,
}: Pick<PageProps<"/admin/posts/[id]/edit">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { id } = await params;

  // 초안 포함 글을 조회한다. 없거나 uuid가 아니면 404로 처리한다.
  const initialPost = await getAdminPostById(id);
  if (!initialPost) notFound();

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">글 수정</h1>
      {/* 다른 글로 이동해도 이전 글의 입력 상태가 남지 않도록 id를 key로 쓴다. */}
      <PostEditor key={initialPost.id} initialPost={initialPost} />
    </main>
  );
}

export default function AdminPostEditPage(
  props: PageProps<"/admin/posts/[id]/edit">,
) {
  return (
    <Suspense fallback={null}>
      <AdminPostEditContent params={props.params} />
    </Suspense>
  );
}
