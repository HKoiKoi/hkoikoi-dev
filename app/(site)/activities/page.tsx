import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/content/list-skeleton";
import { ResumeSection } from "@/components/content/resume-section";

import { ResumeEntries } from "../_components/resume-entries";

export const metadata: Metadata = {
  title: "사회활동",
  description: "대외 활동과 사회활동 내역입니다.",
};

export default function ActivitiesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="사회활동"
        description="대외 활동과 사회활동 내역입니다."
      >
        <Suspense fallback={<ListSkeleton />}>
          <ResumeEntries section="activities" />
        </Suspense>
      </ResumeSection>
    </div>
  );
}
