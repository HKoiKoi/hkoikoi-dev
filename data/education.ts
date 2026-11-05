import type { ResumeEntry } from "@/lib/types/resume";

// 최신 학력이 먼저 오도록 정렬한다.
export const education: ResumeEntry[] = [
  {
    title: "서울신학대학교 일반대학원",
    subtitle: "IT융합학과 석사",
    period: "2024.09.02 ~ 2026.08.20",
    description: "본교 · 경기도 · 졸업",
    grade: "4.2 / 4.5",
  },
  {
    title: "서울신학대학교",
    subtitle: "기독교교육과 학사 (부전공: IT융합소프트웨어학과)",
    period: "2018.02.26 ~ 2024.08.19",
    description: "본교 · 경기도 · 졸업",
    grade: "3.87 / 4.5",
  },
  {
    title: "강화고등학교",
    subtitle: "주간",
    period: "2015.03.02 ~ 2018.02.06",
    description: "인천광역시 · 졸업",
  },
];
