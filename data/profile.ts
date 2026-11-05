import type { Profile } from "@/lib/types/profile";

export const profile: Profile = {
  name: "함상현",
  tagline: "동시성 제어를 연구하는 웹 개발자",
  bio: "기술연구소에서 대학 포털과 NCS 웹정보시스템을 개발·유지보수하고, 국외인적자원시스템의 클라우드 전환과 온프레미스 서버 인프라 구축·관리를 맡았습니다.\n이후 대학원에서 분산 락 메커니즘의 성능을 연구해 석사 학위를 받았고, 지금은 Next.js와 Supabase로 개인 프로젝트를 만들고 있습니다.",
  email: "koikoilove99@gmail.com",
  github: "https://github.com/hkoikoi",
  // public/ 안의 파일은 사이트 루트 경로로 제공된다.
  avatar: "/avatar.png",
};
