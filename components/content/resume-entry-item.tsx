import { ExternalLink } from "lucide-react";

import { TechBadge } from "@/components/content/tech-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ResumeEntry } from "@/lib/types/resume";

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
    <li className={className}>
      <Card className="relative gap-2 border-l-4 border-l-primary px-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h3 className="text-base font-semibold break-words">
            {link ? (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                {title}
                <ExternalLink
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span className="sr-only">(새 탭에서 열림)</span>
              </a>
            ) : (
              title
            )}
          </h3>
          {period && (
            <Badge variant="secondary" className="w-fit shrink-0">
              {period}
            </Badge>
          )}
        </div>
        {subtitle && (
          <p className="text-sm break-words text-muted-foreground">
            {subtitle}
          </p>
        )}
        {description && <p className="text-sm break-words">{description}</p>}
        {tags && tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="태그">
            {tags.map((tag) => (
              <li key={tag}>
                <TechBadge>{tag}</TechBadge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </li>
  );
}
