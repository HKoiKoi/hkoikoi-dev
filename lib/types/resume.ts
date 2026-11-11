import type { Tables } from "@/lib/supabase/database.types";

/** DB 행 타입. 공개 화면에는 아래 표시용 타입으로 바꿔 넘긴다(`lib/queries/resume.ts`의 매퍼). */
export type ResumeEntryRow = Tables<"resume_entries">;
export type ProjectRow = Tables<"projects">;
export type PublicationRow = Tables<"publications">;

/** `resume_entries.section` check 제약과 같은 6종 */
export const RESUME_SECTIONS = [
  "education",
  "career",
  "certifications",
  "volunteer",
  "languages",
  "activities",
] as const;
export type ResumeSection = (typeof RESUME_SECTIONS)[number];

export function isResumeSection(value: string): value is ResumeSection {
  return (RESUME_SECTIONS as readonly string[]).includes(value);
}

/** 관리자 화면의 섹션 이름(공개 페이지 제목과 같다) */
export const RESUME_SECTION_LABELS: Record<ResumeSection, string> = {
  education: "학력",
  career: "경력",
  certifications: "자격증",
  volunteer: "사회봉사",
  languages: "어학",
  activities: "사회활동",
};

/** 학력·경력·자격증·사회봉사·어학·사회활동 공통 항목 */
export type ResumeEntry = {
  title: string;
  subtitle?: string;
  period?: string;
  description?: string;
  /** 카드 오른쪽 하단에 강조해 표시하는 수치(예: 학점 "3.87 / 4.5"). */
  grade?: string;
  /** grade를 스크린리더에 읽어 줄 이름. 없으면 "평점". */
  gradeLabel?: string;
  tags?: string[];
  /** 영역별로 나눈 기술 스택. 영역마다 한 줄로 표시한다(예: 개발, 데이터베이스). */
  tagGroups?: { label: string; tags: string[] }[];
  link?: string;
};

export type Project = {
  name: string;
  summary: string;
  period: string;
  role: string;
  stack: string[];
  links: {
    github?: string;
    demo?: string;
  };
  /**
   * 메인 대표 프로젝트 표시 여부.
   * 기본 규칙: featured가 3개 미만이면 목록 앞에서부터 채워 3개를 표시한다.
   */
  featured?: boolean;
};

export type Publication = {
  title: string;
  authors: string;
  venue: string;
  year: number;
  /** 공개된 게재 페이지 주소. 없으면 제목을 링크 없이 표시한다. */
  link?: string;
};
