import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ResumeEntry } from "@/lib/types/resume";
import { cn } from "@/lib/utils";

interface ResumeEntryItemProps extends ResumeEntry {
  className?: string;
}

// 이력 항목 한 줄 (학력·경력·자격증 등 공통)
export function ResumeEntryItem({
  title,
  subtitle,
  period,
  description,
  tags,
  link,
  className,
}: ResumeEntryItemProps) {
  return (
    <li className={cn("space-y-2 py-4", className)}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
        <h3 className="font-medium break-words">
          {link ? (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:underline"
            >
              {title}
              <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">(새 탭에서 열림)</span>
            </a>
          ) : (
            title
          )}
        </h3>
        {period && (
          <p className="shrink-0 text-sm text-muted-foreground">{period}</p>
        )}
      </div>
      {subtitle && (
        <p className="text-sm break-words text-muted-foreground">{subtitle}</p>
      )}
      {description && <p className="text-sm break-words">{description}</p>}
      {tags && tags.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="태그">
          {tags.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary">{tag}</Badge>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
