import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "@/lib/types/resume";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

// 프로젝트 카드 (이름·요약·기간·역할·스택·외부 링크)
export function ProjectCard({ project, className }: ProjectCardProps) {
  const { name, summary, period, role, stack, links } = project;
  const hasLinks = Boolean(links.github || links.demo);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="break-words">{name}</CardTitle>
        <CardDescription className="break-words">{summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm break-words text-muted-foreground">
          {period} · {role}
        </p>
        {stack.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="기술 스택">
            {stack.map((item) => (
              <li key={item}>
                <Badge variant="secondary">{item}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {hasLinks && (
        <CardFooter className="flex flex-wrap gap-2">
          {links.github && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <a href={links.github} target="_blank" rel="noreferrer" />
              }
            >
              GitHub
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
              <span className="sr-only">(새 탭에서 열림)</span>
            </Button>
          )}
          {links.demo && (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href={links.demo} target="_blank" rel="noreferrer" />}
            >
              데모
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
              <span className="sr-only">(새 탭에서 열림)</span>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
