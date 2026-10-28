import { ExternalLink } from "lucide-react";

import type { Publication } from "@/lib/types/resume";
import { cn } from "@/lib/utils";

interface PublicationItemProps {
  publication: Publication;
  className?: string;
}

// 논문 항목 (제목·저자·학회·연도·외부 링크)
export function PublicationItem({
  publication,
  className,
}: PublicationItemProps) {
  const { title, authors, venue, year, link } = publication;

  return (
    <li className={cn("space-y-1 py-4", className)}>
      <h3 className="font-medium break-words">
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
      </h3>
      <p className="text-sm break-words text-muted-foreground">{authors}</p>
      <p className="text-sm break-words text-muted-foreground">
        {venue} · {year}
      </p>
    </li>
  );
}
