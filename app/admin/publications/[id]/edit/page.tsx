import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PublicationForm } from "@/app/admin/publications/_components/publication-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPublication } from "@/lib/queries/admin-resume";
import { publicationToFormValues } from "@/lib/schemas/publication";

async function AdminPublicationEditContent({
  params,
}: Pick<PageProps<"/admin/publications/[id]/edit">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { id } = await params;

  // 숨김 논문도 조회한다. 없거나 uuid가 아니면 404로 처리한다.
  const publication = await getAdminPublication(id);
  if (!publication) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">논문 수정</h1>
      <PublicationForm
        key={publication.id}
        publicationId={publication.id}
        initialValues={publicationToFormValues(publication)}
      />
    </div>
  );
}

export default function AdminPublicationEditPage(
  props: PageProps<"/admin/publications/[id]/edit">,
) {
  return (
    <Suspense fallback={null}>
      <AdminPublicationEditContent params={props.params} />
    </Suspense>
  );
}
