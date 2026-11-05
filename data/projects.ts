import type { Project } from "@/lib/types/resume";

export const projects: Project[] = [
  {
    name: "hkoikoi.dev",
    summary:
      "이력과 프로젝트를 공개하고 마크다운으로 블로그 글을 발행하는 개인 포트폴리오·블로그 사이트",
    period: "2026.10 ~ 진행 중",
    role: "개인 프로젝트",
    stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "shadcn/ui"],
    links: { github: "https://github.com/HKoiKoi/hkoikoi-dev" },
    featured: true,
  },
  {
    name: "Distributed Lock Burst Benchmark",
    summary:
      "수강신청 시스템을 모사해 버스트 트래픽 상황에서 RDBMS, Redis, ZooKeeper 기반 동시성 제어 전략의 성능과 안정성을 비교한 석사논문 연구",
    period: "2026.03 ~ 2026.06",
    role: "석사논문 연구",
    stack: [
      "Java",
      "Spring Boot",
      "Spring Data JPA",
      "MySQL",
      "Redis",
      "ZooKeeper",
      "nGrinder",
      "Nginx",
    ],
    links: {
      github: "https://github.com/HKoiKoi/concurrency-control-benchmarks",
    },
    featured: true,
  },
  {
    name: "SCO 순찰 일지",
    summary:
      "SCO 관리형 독서실의 순찰 업무를 스마트폰·태블릿에서 최소 터치로 기록하고 일지를 조회하는 웹 앱",
    period: "2026.10",
    role: "개인 프로젝트",
    stack: ["Next.js", "TypeScript", "Supabase", "Tailwind CSS", "shadcn/ui"],
    links: {
      github: "https://github.com/HKoiKoi/hkoikoi-sco-patrol",
      demo: "https://sco.hkoikoi.dev",
    },
    featured: true,
  },
  {
    name: "노션 타이핑 연습",
    summary:
      "노션 데이터베이스의 예문을 불러와 글자별 실시간 판정과 결과 요약을 제공하는 타이핑 연습 웹앱",
    period: "2026.10",
    role: "개인 프로젝트",
    stack: ["Next.js", "TypeScript", "Notion API", "Tailwind CSS", "shadcn/ui"],
    links: {
      github: "https://github.com/HKoiKoi/hkoikoi-typing-web-notion-claude",
      demo: "https://typing.hkoikoi.dev",
    },
  },
];
