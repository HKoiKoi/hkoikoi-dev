import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostEditor } from "@/app/admin/posts/edit/_components/post-editor";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPostById } from "@/lib/queries/admin-posts";

// 같은 키가 여러 번 오면 첫 값을 사용한다.
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// searchParams는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function AdminPostEditContent({
  searchParams,
}: Pick<PageProps<"/admin/posts/edit">, "searchParams">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  // 빈 문자열이나 값 없는 id는 새 글 작성으로 취급한다.
  const id = first((await searchParams).id)?.trim() || undefined;

  // id가 있으면 초안 포함 글을 조회하고, 없거나 uuid가 아니면 404로 처리한다.
  const initialPost = id ? await getAdminPostById(id) : undefined;
  if (id && !initialPost) notFound();

  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">{id ? "글 수정" : "글 작성"}</h1>
      <PostEditor initialPost={initialPost ?? undefined} />
    </main>
  );
}

export default function AdminPostEditPage(
  props: PageProps<"/admin/posts/edit">,
) {
  return (
    <Suspense fallback={null}>
      <AdminPostEditContent searchParams={props.searchParams} />
    </Suspense>
  );
}
