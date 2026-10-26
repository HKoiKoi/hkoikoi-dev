import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  message?: string;
  className?: string;
}

// 목록이 비었을 때 보여주는 안내 영역
export function EmptyState({ title, message, className }: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-12 text-center",
        className,
      )}
    >
      <p className="text-base font-medium break-words">{title}</p>
      {message && (
        <p className="text-sm break-words text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
