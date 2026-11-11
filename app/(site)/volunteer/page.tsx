import type { Metadata } from "next";

import { ResumeSection } from "@/components/content/resume-section";
import { getResumeEntries } from "@/lib/queries/resume";

export const metadata: Metadata = {
  title: "사회봉사",
  description: "사회봉사 활동 내역입니다.",
};

export default async function VolunteerPage() {
  const entries = await getResumeEntries("volunteer");

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="사회봉사"
        description="사회봉사 활동 내역입니다."
        entries={entries}
      />
    </div>
  );
}
