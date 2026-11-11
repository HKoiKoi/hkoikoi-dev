import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/content/list-skeleton";
import { PageHeader } from "@/components/content/page-header";

import { PublicationList } from "../_components/publication-list";

export const metadata: Metadata = {
  title: "논문",
  description: "발표한 논문을 연도순으로 정리한 페이지입니다.",
};

export default function PublicationsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <PageHeader
        title="논문"
        description="발표한 논문을 연도순으로 정리한 페이지입니다."
      />
      <Suspense fallback={<ListSkeleton />}>
        <PublicationList />
      </Suspense>
    </div>
  );
}
