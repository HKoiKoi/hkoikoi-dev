import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminItemList } from "@/app/admin/_components/admin-item-list";
import {
  deleteResumeEntry,
  moveResumeEntry,
  toggleResumeVisibility,
} from "@/app/admin/resume/actions";
import { buttonVariants } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminResumeEntries } from "@/lib/queries/admin-resume";
import {
  RESUME_SECTIONS,
  RESUME_SECTION_LABELS,
  isResumeSection,
} from "@/lib/types/resume";
import { cn } from "@/lib/utils";

// params는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function AdminResumeContent({
  params,
}: Pick<PageProps<"/admin/resume/[section]">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { section } = await params;
  if (!isResumeSection(section)) notFound();

  // 숨김 항목까지 포함해 조회한다. 반드시 requireAdmin() 이후에 호출한다.
  const entries = await getAdminResumeEntries(section);
  const label = RESUME_SECTION_LABELS[section];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">이력 관리: {label}</h1>
        <Link
          href={`/admin/resume/${section}/new`}
          className={buttonVariants()}
        >
          새 항목
        </Link>
      </div>

      {/* 섹션 전환: 라우트가 바뀌므로 탭 모양의 링크로 둔다. */}
      <nav aria-label="이력 섹션" className="flex flex-wrap gap-1">
        {RESUME_SECTIONS.map((item) => (
          <Link
            key={item}
            href={`/admin/resume/${item}`}
            aria-current={item === section ? "page" : undefined}
            className={cn(
              buttonVariants({
                variant: item === section ? "secondary" : "ghost",
                size: "sm",
              }),
              "aria-[current=page]:font-semibold",
            )}
          >
            {RESUME_SECTION_LABELS[item]}
          </Link>
        ))}
      </nav>

      <AdminItemList
        items={entries.map((entry) => ({
          id: entry.id,
          title: entry.title,
          meta: entry.period ?? undefined,
          visible: entry.is_visible,
        }))}
        caption={`${label} 목록`}
        emptyMessage="등록된 항목이 없습니다."
        noun="항목"
        editBasePath={`/admin/resume/${section}`}
        toggleAction={toggleResumeVisibility}
        deleteAction={deleteResumeEntry}
        moveAction={moveResumeEntry}
      />
    </div>
  );
}

export default function AdminResumePage(
  props: PageProps<"/admin/resume/[section]">,
) {
  return (
    <Suspense fallback={null}>
      <AdminResumeContent params={props.params} />
    </Suspense>
  );
}
