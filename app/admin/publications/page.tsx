import Link from "next/link";
import { Suspense } from "react";
import { AdminItemList } from "@/app/admin/_components/admin-item-list";
import {
  deletePublication,
  togglePublicationVisibility,
} from "@/app/admin/publications/actions";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPublications } from "@/lib/queries/admin-resume";

export default function AdminPublicationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminPublicationsContent />
    </Suspense>
  );
}

async function AdminPublicationsContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  // 숨김 논문까지 포함해 조회한다. 반드시 requireAdmin() 이후에 호출한다.
  const publications = await getAdminPublications();

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">논문 관리</h1>
        <Link href="/admin/publications/new" className={buttonVariants()}>
          새 논문
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        논문은 공개 화면과 같이 연도 내림차순으로 표시되어 순서를 직접 바꿀 수
        없습니다. 같은 연도 안에서는 등록한 순서를 따릅니다.
      </p>
      <AdminItemList
        items={publications.map((publication) => ({
          id: publication.id,
          title: publication.title,
          meta: [String(publication.year), publication.venue]
            .filter(Boolean)
            .join(" · "),
          visible: publication.is_visible,
        }))}
        caption="논문 목록"
        emptyMessage="등록된 논문이 없습니다."
        noun="논문"
        editBasePath="/admin/publications"
        toggleAction={togglePublicationVisibility}
        deleteAction={deletePublication}
      />
    </div>
  );
}
