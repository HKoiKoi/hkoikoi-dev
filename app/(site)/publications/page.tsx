import type { Metadata } from "next";

import { EmptyState } from "@/components/content/empty-state";
import { PageHeader } from "@/components/content/page-header";
import { PublicationItem } from "@/components/content/publication-item";
import { getPublications } from "@/lib/queries/resume";

export const metadata: Metadata = {
  title: "논문",
  description: "발표한 논문을 연도순으로 정리한 페이지입니다.",
};

export default async function PublicationsPage() {
  // 연도 내림차순 정렬은 getPublications가 한다.
  const items = await getPublications();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <PageHeader
        title="논문"
        description="발표한 논문을 연도순으로 정리한 페이지입니다."
      />
      {items.length === 0 ? (
        <EmptyState
          title="아직 등록된 논문이 없습니다"
          message="곧 업데이트될 예정입니다."
        />
      ) : (
        <ul className="divide-y">
          {items.map((publication) => (
            <PublicationItem
              key={`${publication.year}-${publication.title}`}
              publication={publication}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
