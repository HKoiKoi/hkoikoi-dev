import { Suspense } from "react";
import { OrphanList } from "@/app/admin/storage/_components/orphan-list";
import { requireAdmin } from "@/lib/auth/require-admin";
import { DEFAULT_GRACE_DAYS } from "@/lib/storage/find-orphans";
import { loadOrphanCandidates } from "@/lib/storage/load-orphan-candidates";

export default function AdminStoragePage() {
  return (
    <Suspense fallback={null}>
      <AdminStorageContent />
    </Suspense>
  );
}

async function AdminStorageContent() {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  // 반드시 requireAdmin() 이후에 호출한다. 기본 화면은 목록만 보여 주는 드라이런이다.
  const result = await loadOrphanCandidates();

  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold">스토리지</h1>
        <p className="text-sm text-muted-foreground">
          어떤 글에서도 참조하지 않고 업로드 후 {DEFAULT_GRACE_DAYS}일이 지난
          이미지입니다. 삭제하면 되돌릴 수 없습니다.
        </p>
      </div>
      {result.ok ? (
        <OrphanList candidates={result.candidates} total={result.total} />
      ) : (
        <p
          role="alert"
          className="rounded-xl border border-destructive/50 p-8 text-center text-sm text-destructive"
        >
          {result.message} 안전을 위해 목록을 표시하지 않습니다.
        </p>
      )}
    </div>
  );
}
