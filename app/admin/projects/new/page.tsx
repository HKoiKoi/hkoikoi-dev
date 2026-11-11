import { Suspense } from "react";
import { ProjectForm } from "@/app/admin/projects/_components/project-form";
import { requireAdmin } from "@/lib/auth/require-admin";

async function AdminProjectNewContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">새 프로젝트</h1>
      <ProjectForm />
    </div>
  );
}

export default function AdminProjectNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminProjectNewContent />
    </Suspense>
  );
}
