import type { Metadata } from "next";

import { ResumeSection } from "@/components/content/resume-section";
import { getResumeEntries } from "@/lib/queries/resume";

export const metadata: Metadata = {
  title: "학력",
  description: "학력 사항을 정리한 페이지입니다.",
};

export default async function EducationPage() {
  const entries = await getResumeEntries("education");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="학력"
        description="학력 사항을 정리한 페이지입니다."
        entries={entries}
      />
    </div>
  );
}
