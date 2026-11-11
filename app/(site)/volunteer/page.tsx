import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/content/list-skeleton";
import { ResumeSection } from "@/components/content/resume-section";

import { ResumeEntries } from "../_components/resume-entries";

export const metadata: Metadata = {
  title: "사회봉사",
  description: "사회봉사 활동 내역입니다.",
};

export default function VolunteerPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection title="사회봉사" description="사회봉사 활동 내역입니다.">
        <Suspense fallback={<ListSkeleton />}>
          <ResumeEntries section="volunteer" />
        </Suspense>
      </ResumeSection>
    </div>
  );
}
