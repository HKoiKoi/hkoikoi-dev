import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProjectForm } from "@/app/admin/projects/_components/project-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminProject } from "@/lib/queries/admin-resume";
import { projectToFormValues } from "@/lib/schemas/project";

async function AdminProjectEditContent({
  params,
}: Pick<PageProps<"/admin/projects/[id]/edit">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { id } = await params;

  // 숨김 프로젝트도 조회한다. 없거나 uuid가 아니면 404로 처리한다.
  const project = await getAdminProject(id);
  if (!project) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">프로젝트 수정</h1>
      <ProjectForm
        key={project.id}
        projectId={project.id}
        initialValues={projectToFormValues(project)}
      />
    </div>
  );
}

export default function AdminProjectEditPage(
  props: PageProps<"/admin/projects/[id]/edit">,
) {
  return (
    <Suspense fallback={null}>
      <AdminProjectEditContent params={props.params} />
    </Suspense>
  );
}
