import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

// 페이지 상단 제목 영역 (정적 마크업)
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <header className={cn("space-y-2 pb-6", className)}>
      <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
        {title}
      </h1>
      {description && (
        <p className="text-sm break-words text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </header>
  );
}
