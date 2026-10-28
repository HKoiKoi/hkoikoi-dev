import type { Metadata } from "next";

import { ResumeSection } from "@/components/content/resume-section";
import { career } from "@/data/career";

export const metadata: Metadata = {
  title: "경력",
  description: "근무 경력과 담당 업무를 정리한 페이지입니다.",
};

export default function CareerPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="경력"
        description="근무 경력과 담당 업무를 정리한 페이지입니다."
        entries={career}
      />
    </div>
  );
}
