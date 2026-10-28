import type { Metadata } from "next";

import { ResumeSection } from "@/components/content/resume-section";
import { languages } from "@/data/languages";

export const metadata: Metadata = {
  title: "어학",
  description: "어학 시험 성적과 취득일을 정리한 페이지입니다.",
};

export default function LanguagesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="어학"
        description="어학 시험 성적과 취득일을 정리한 페이지입니다."
        entries={languages}
      />
    </div>
  );
}
