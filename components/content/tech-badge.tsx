import { cn } from "@/lib/utils";

interface TechBadgeProps {
  children: React.ReactNode;
  className?: string;
}

// 기술 스택·태그 배지: 그라데이션 테두리 + 빛이 지나가는 shimmer 효과
// (prefers-reduced-motion 환경에서는 애니메이션 없이 정적으로 표시)
export function TechBadge({ children, className }: TechBadgeProps) {
  return (
    <span
      className={cn(
        "group relative inline-flex overflow-hidden rounded-full bg-linear-to-r from-primary/70 via-accent to-primary/70 p-px shadow-sm transition-shadow hover:shadow-md",
        className,
      )}
    >
      <span className="relative z-10 rounded-full bg-card px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-card-foreground">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 -translate-x-full bg-linear-to-r from-transparent via-primary/30 to-transparent motion-safe:animate-shimmer"
      />
    </span>
  );
}
