export const siteConfig = {
  name: "hkoikoi.dev",
} as const;

export const navItems = [
  { label: "메인", href: "/" },
  { label: "학력", href: "/education" },
  { label: "경력", href: "/career" },
  { label: "자격증", href: "/certifications" },
  { label: "사회봉사", href: "/volunteer" },
  { label: "어학", href: "/languages" },
  { label: "사회활동", href: "/activities" },
  { label: "프로젝트", href: "/projects" },
  { label: "논문", href: "/publications" },
  { label: "블로그", href: "/blog" },
] as const;
