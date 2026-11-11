export const siteConfig = {
  name: "hkoikoi.dev",
  description: "hkoikoi의 개발 블로그와 프로젝트 기록",
  // giscus(GitHub Discussions) 댓글 설정. 모두 공개 식별자라 비밀이 아니다.
  // 값 중 하나라도 비면 댓글 영역을 렌더링하지 않는다.
  giscus: {
    repo: "HKoiKoi/hkoikoi-dev",
    repoId: "R_kgDOVWz1vA",
    category: "Comments",
    categoryId: "DIC_kwDOVWz1vM4DK264",
  },
} as const;

type NavLeaf = { label: string; href: string };
export type NavGroup = { label: string; children: readonly NavLeaf[] };
export type NavItem = NavLeaf | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

export const navItems: readonly NavItem[] = [
  {
    label: "이력",
    children: [
      { label: "학력", href: "/education" },
      { label: "경력", href: "/career" },
      { label: "자격증", href: "/certifications" },
      { label: "어학", href: "/languages" },
    ],
  },
  {
    label: "활동",
    children: [
      { label: "사회봉사", href: "/volunteer" },
      { label: "사회활동", href: "/activities" },
    ],
  },
  { label: "프로젝트", href: "/projects" },
  { label: "논문", href: "/publications" },
  { label: "블로그", href: "/blog" },
];
