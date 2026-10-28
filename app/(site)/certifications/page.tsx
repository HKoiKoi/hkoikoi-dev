import type { Metadata } from "next";

import { ResumeSection } from "@/components/content/resume-section";
import { certifications } from "@/data/certifications";

export const metadata: Metadata = {
  title: "자격증",
  description: "취득한 자격증 목록입니다.",
};

export default function CertificationsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <ResumeSection
        title="자격증"
        description="취득한 자격증 목록입니다."
        entries={certifications}
      />
    </div>
  );
}
