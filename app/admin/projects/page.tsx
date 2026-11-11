import Link from "next/link";
import { Suspense } from "react";
import { AdminItemList } from "@/app/admin/_components/admin-item-list";
import {
  deleteProject,
  moveProject,
  toggleProjectVisibility,
} from "@/app/admin/projects/actions";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminProjects } from "@/lib/queries/admin-resume";

export default function AdminProjectsPage() {
  return (
    <Suspense fallback={null}>
      <AdminProjectsContent />
    </Suspense>
  );
}

async function AdminProjectsContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  // 숨김 프로젝트까지 포함해 조회한다. 반드시 requireAdmin() 이후에 호출한다.
  const projects = await getAdminProjects();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">프로젝트 관리</h1>
        <Link href="/admin/projects/new" className={buttonVariants()}>
          새 프로젝트
        </Link>
      </div>
      <AdminItemList
        items={projects.map((project) => ({
          id: project.id,
          title: project.name,
          meta: project.period || undefined,
          visible: project.is_visible,
          badges: project.featured ? ["대표"] : undefined,
        }))}
        caption="프로젝트 목록"
        emptyMessage="등록된 프로젝트가 없습니다."
        noun="프로젝트"
        editBasePath="/admin/projects"
        toggleAction={toggleProjectVisibility}
        deleteAction={deleteProject}
        moveAction={moveProject}
      />
    </div>
  );
}
