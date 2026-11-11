import { ResumeEntryList } from "@/components/content/resume-entry-list";
import { getResumeEntries } from "@/lib/queries/resume";
import type { ResumeSection } from "@/lib/types/resume";

// 섹션 이력 조회. 조회가 실패하면 수명 0 결과를 받아 프리렌더에서 동적 접근으로 취급되므로
// 호출하는 쪽이 Suspense로 감싸야 한다.
export async function ResumeEntries({ section }: { section: ResumeSection }) {
  const entries = await getResumeEntries(section);
  return <ResumeEntryList entries={entries} />;
}
