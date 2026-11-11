import { EmptyState } from "@/components/content/empty-state";
import { ProjectCard } from "@/components/content/project-card";
import { selectFeatured } from "@/lib/projects/select-featured";
import { getProjects } from "@/lib/queries/resume";

interface ProjectListProps {
  /** true면 메인 대표 프로젝트(selectFeatured)만 보여 준다. */
  featuredOnly?: boolean;
}

// 프로젝트 목록 조회. 호출하는 쪽이 Suspense로 감싸야 한다(resume-entries.tsx 참고).
export async function ProjectList({ featuredOnly = false }: ProjectListProps) {
  const all = await getProjects();
  const projects = featuredOnly ? selectFeatured(all) : all;

  if (projects.length === 0) {
    return featuredOnly ? (
      <EmptyState title="아직 등록된 프로젝트가 없습니다" />
    ) : (
      <EmptyState
        title="아직 등록된 프로젝트가 없습니다"
        message="곧 업데이트될 예정입니다."
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {projects.map((project) => (
        <li key={project.name}>
          <ProjectCard project={project} />
        </li>
      ))}
    </ul>
  );
}
