import type { Metadata } from "next";

import { EmptyState } from "@/components/content/empty-state";
import { PageHeader } from "@/components/content/page-header";
import { ProjectCard } from "@/components/content/project-card";
import { projects } from "@/data/projects";

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
      {projects.length === 0 ? (
        <EmptyState
          title="아직 등록된 프로젝트가 없습니다"
          message="곧 업데이트될 예정입니다."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <li key={project.name}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
