import type { Project } from "@/lib/types/resume";

// featured 프로젝트를 우선하고, count개에 못 미치면 나머지를 원래 순서로 채운다
export function selectFeatured(projects: Project[], count = 3): Project[] {
  const featured = projects.filter((project) => project.featured);
  const rest = projects.filter((project) => !project.featured);
  return [...featured, ...rest].slice(0, count);
}
