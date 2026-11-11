import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResumeForm } from "@/app/admin/resume/_components/resume-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminResumeEntry } from "@/lib/queries/admin-resume";
import { entryToFormValues } from "@/lib/schemas/resume";
import { RESUME_SECTION_LABELS, isResumeSection } from "@/lib/types/resume";

async function AdminResumeEditContent({
  params,
}: Pick<PageProps<"/admin/resume/[section]/[id]/edit">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { section, id } = await params;
  if (!isResumeSection(section)) notFound();

  // 숨김 항목도 조회한다. 없거나 uuid가 아니거나 다른 섹션의 항목이면 404로 처리한다.
  const entry = await getAdminResumeEntry(id);
  if (!entry || entry.section !== section) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">
        항목 수정: {RESUME_SECTION_LABELS[section]}
      </h1>
      {/* 다른 항목으로 이동해도 이전 입력 상태가 남지 않도록 id를 key로 쓴다. */}
      <ResumeForm
        key={entry.id}
        section={section}
        entryId={entry.id}
        initialValues={entryToFormValues(entry)}
      />
    </div>
  );
}

export default function AdminResumeEditPage(
  props: PageProps<"/admin/resume/[section]/[id]/edit">,
) {
  return (
    <Suspense fallback={null}>
      <AdminResumeEditContent params={props.params} />
    </Suspense>
  );
}
