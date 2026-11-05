import type { ResumeEntry } from "@/lib/types/resume";

// 최신 경력이 먼저 오도록 정렬한다.
export const career: ResumeEntry[] = [
  {
    title: "(주)신나는플랫폼",
    subtitle: "기술연구소 · 주임 · 정규직",
    period: "2024.07.15 ~ 2025.12.31",
    description:
      "대학 포털 사이트와 NCS 웹정보시스템 개발 및 유지보수 · 국립국제교육원 국외인적자원시스템 클라우드 전환 사업 진행 및 유지보수 ·\n사내 온프레미스 서버 인프라 구축 및 관리",
    tagGroups: [
      {
        label: "개발",
        tags: ["Java", "JSP", "Spring Boot", "MyBatis", "jQuery", "React"],
      },
      { label: "데이터베이스", tags: ["Oracle", "MariaDB", "MS-SQL"] },
      {
        label: "인프라·배포",
        tags: ["AWS", "Ubuntu", "JBoss", "Jenkins"],
      },
    ],
  },
];
