import { EmptyState } from "@/components/content/empty-state";
import { ResumeEntryItem } from "@/components/content/resume-entry-item";
import type { ResumeEntry } from "@/lib/types/resume";

interface ResumeEntryListProps {
  entries: ResumeEntry[];
}

// 이력 항목 목록 (비었을 때 빈 상태 표시)
export function ResumeEntryList({ entries }: ResumeEntryListProps) {
  if (entries.length === 0) {
    return <EmptyState title="아직 등록된 항목이 없습니다" />;
  }

  return (
    <ul className="grid gap-4">
      {entries.map((entry) => (
        <ResumeEntryItem
          key={`${entry.title}-${entry.period ?? ""}`}
          {...entry}
        />
      ))}
    </ul>
  );
}
