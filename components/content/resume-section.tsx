import type { ReactNode } from "react";

import { PageHeader } from "@/components/content/page-header";
import { cn } from "@/lib/utils";

interface ResumeSectionProps {
  title: string;
  description?: string;
  /** 목록 영역. 데이터를 읽는 컴포넌트는 호출하는 쪽에서 Suspense로 감싼다. */
  children: ReactNode;
  className?: string;
}

// 이력 섹션 (정적 제목 영역 + 목록 슬롯)
export function ResumeSection({
  title,
  description,
  children,
  className,
}: ResumeSectionProps) {
  return (
    <section className={cn(className)}>
      <PageHeader title={title} description={description} />
      {children}
    </section>
  );
}
