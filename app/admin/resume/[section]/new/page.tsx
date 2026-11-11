import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ResumeForm } from "@/app/admin/resume/_components/resume-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { RESUME_SECTION_LABELS, isResumeSection } from "@/lib/types/resume";

async function AdminResumeNewContent({
  params,
}: Pick<PageProps<"/admin/resume/[section]/new">, "params">) {
  // 레이아웃 검사에만 의존하지 않고 페이지에서도 관리자 권한을 확인한다.
  await requireAdmin();

  const { section } = await params;
  if (!isResumeSection(section)) notFound();

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold">
        새 항목: {RESUME_SECTION_LABELS[section]}
      </h1>
      <ResumeForm section={section} />
    </div>
  );
}

export default function AdminResumeNewPage(
  props: PageProps<"/admin/resume/[section]/new">,
) {
  return (
    <Suspense fallback={null}>
      <AdminResumeNewContent params={props.params} />
    </Suspense>
  );
}
