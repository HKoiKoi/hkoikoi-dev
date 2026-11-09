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
  grade,
  gradeLabel = "평점",
  tags,
  tagGroups,
  link,
  className,
}: ResumeEntryItemProps) {
  // 평점은 description이 있으면 그 줄 오른쪽에, 없으면 subtitle 줄 오른쪽에 붙인다.
  const gradeBadge = grade && (
    <Badge variant="outline" className="ml-auto shrink-0 tabular-nums">
      <span className="sr-only">{gradeLabel} </span>
      {grade}
    </Badge>
  );

  return (
    <li className={className}>
      <Card className="relative gap-2 border-l-4 border-l-primary px-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <h2 className="text-base font-semibold break-words">
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
          </h2>
          {period && (
            <Badge variant="secondary" className="w-fit shrink-0">
              {period}
            </Badge>
          )}
        </div>
        {(subtitle || (grade && !description)) && (
          <div className="flex items-baseline justify-between gap-4">
            {subtitle && (
              <p className="text-sm break-words text-muted-foreground">
                {subtitle}
              </p>
            )}
            {!description && gradeBadge}
          </div>
        )}
        {description && (
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm break-words whitespace-pre-line">
              {description}
            </p>
            {gradeBadge}
          </div>
        )}
        {tags && tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="태그">
            {tags.map((tag) => (
              <li key={tag}>
                <TechBadge>{tag}</TechBadge>
              </li>
            ))}
          </ul>
        )}
        {tagGroups && tagGroups.length > 0 && (
          <dl className="grid gap-1.5">
            {tagGroups.map((group) => (
              <div
                key={group.label}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3"
              >
                <dt className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
                  {group.label}
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.tags.map((tag) => (
                      <li key={tag}>
                        <TechBadge>{tag}</TechBadge>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Card>
    </li>
  );
}
