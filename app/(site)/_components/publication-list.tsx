import { EmptyState } from "@/components/content/empty-state";
import { PublicationItem } from "@/components/content/publication-item";
import { getPublications } from "@/lib/queries/resume";

// 논문 목록 조회(연도 내림차순 정렬은 getPublications가 한다). 호출하는 쪽이 Suspense로 감싸야 한다.
export async function PublicationList() {
  const items = await getPublications();

  if (items.length === 0) {
    return (
      <EmptyState
        title="아직 등록된 논문이 없습니다"
        message="곧 업데이트될 예정입니다."
      />
    );
  }

  return (
    <ul className="divide-y">
      {items.map((publication) => (
        <PublicationItem
          key={`${publication.year}-${publication.title}`}
          publication={publication}
        />
      ))}
    </ul>
  );
}
