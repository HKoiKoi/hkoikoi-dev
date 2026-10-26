export const siteConfig = {
  name: "hkoikoi.dev",
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
