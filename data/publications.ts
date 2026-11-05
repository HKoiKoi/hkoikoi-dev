import type { Publication } from "@/lib/types/resume";

// 연도 내림차순으로 보이며, 같은 연도는 이 배열의 순서(최신순)를 따른다.
export const publications: Publication[] = [
  {
    title:
      "분산 WAS 환경에서의 RDBMS, Redis 및 ZooKeeper 기반 락 메커니즘의 성능 비교 분석",
    authors: "함상현, 박채은, 정택준, 김문성",
    venue: "한국인터넷정보학회 인터넷컴퓨팅 및 서비스(JICS) 27(5), 129-137",
    year: 2026,
    link: "https://www.jics.or.kr/digital-library/108406",
  },
  {
    title:
      "Design of an Adaptive Framework Based on Performance Analysis of Distributed Lock Mechanisms in Distributed WAS Environments",
    authors: "함상현",
    venue: "서울신학대학교 일반대학원 석사학위논문",
    year: 2026,
    link: "https://www.riss.kr/search/detail/DetailView.do?p_mat_type=be54d9b8bc7cdb09&control_no=318a430b2707065fffe0bdc3ef48d419",
  },
  {
    title: "다중 WAS 환경에서의 RDBMS와 Redis 기반 락 메커니즘 비교 연구",
    authors: "박채은, 함상현, 김선정, 정택준, 박기섭, 김문성",
    venue: "2026년도 한국인터넷정보학회 춘계학술발표대회 논문집 27(1)",
    year: 2026,
  },
];
