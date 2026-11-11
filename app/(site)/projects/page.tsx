import type { Metadata } from "next";
import { Suspense } from "react";

import { ListSkeleton } from "@/components/content/list-skeleton";
import { PageHeader } from "@/components/content/page-header";

import { ProjectList } from "../_components/project-list";

export const metadata: Metadata = {
  title: "프로젝트",
  description: "진행했던 프로젝트를 정리한 페이지입니다.",
};

export default function ProjectsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <PageHeader
        title="프로젝트"
        description="진행했던 프로젝트를 정리한 페이지입니다."
      />
      <Suspense fallback={<ListSkeleton columns={2} count={4} />}>
        <ProjectList />
      </Suspense>
    </div>
  );
}
