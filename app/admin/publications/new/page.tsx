import { Suspense } from "react";
import { PublicationForm } from "@/app/admin/publications/_components/publication-form";
import { requireAdmin } from "@/lib/auth/require-admin";

async function AdminPublicationNewContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">새 논문</h1>
      <PublicationForm />
    </div>
  );
}

export default function AdminPublicationNewPage() {
  return (
    <Suspense fallback={null}>
      <AdminPublicationNewContent />
    </Suspense>
  );
}
