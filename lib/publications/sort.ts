import type { Publication } from "@/lib/types/resume";

// 연도 내림차순 정렬 (원본 배열은 변경하지 않는다)
export function sortPublications(items: Publication[]): Publication[] {
  return [...items].sort((a, b) => b.year - a.year);
}
