import { Fragment } from "react";

import { EmptyState } from "@/components/content/empty-state";
import { PageHeader } from "@/components/content/page-header";
import { ResumeEntryItem } from "@/components/content/resume-entry-item";
import { Separator } from "@/components/ui/separator";
import type { ResumeEntry } from "@/lib/types/resume";
import { cn } from "@/lib/utils";

interface ResumeSectionProps {
  title: string;
  description?: string;
  entries: ResumeEntry[];
  className?: string;
}

// 이력 섹션 (제목 + 항목 목록, 비었을 때 빈 상태 표시)
export function ResumeSection({
  title,
  description,
  entries,
  className,
}: ResumeSectionProps) {
  return (
    <section className={cn(className)}>
      <PageHeader title={title} description={description} />
      {entries.length === 0 ? (
        <EmptyState title="아직 등록된 항목이 없습니다" />
      ) : (
        <ul>
          {entries.map((entry, index) => (
            <Fragment key={`${entry.title}-${entry.period ?? ""}`}>
              {/* ul의 직계 자식은 li여야 하므로 구분선을 presentation li로 감쌈 */}
              {index > 0 && (
                <li role="presentation" aria-hidden="true">
                  <Separator />
                </li>
              )}
              <ResumeEntryItem {...entry} />
            </Fragment>
          ))}
        </ul>
      )}
    </section>
  );
}
