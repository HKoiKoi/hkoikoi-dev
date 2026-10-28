/** 학력·경력·자격증·사회봉사·어학·사회활동 공통 항목 */
export type ResumeEntry = {
  title: string;
  subtitle?: string;
  period?: string;
  description?: string;
  tags?: string[];
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
  link: string;
};
