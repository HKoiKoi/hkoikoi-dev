import Link from "next/link";

import { PostCard } from "@/components/blog/post-card";
import { EmptyState } from "@/components/content/empty-state";
import { ProjectCard } from "@/components/content/project-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { dummyPosts } from "@/lib/dummy/posts";
import { filterPosts } from "@/lib/posts/filter";
import { selectFeatured } from "@/lib/projects/select-featured";
import { isNavGroup, navItems } from "@/lib/site-config";

// 그룹 메뉴를 펼쳐 이동 가능한 leaf 링크만 평탄화한다.
const shortcuts = navItems.flatMap((item) =>
  isNavGroup(item) ? item.children : [item],
);

export default function Home() {
  const featuredProjects = selectFeatured(projects);
  const latestPosts = filterPosts(dummyPosts).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-14 px-4 py-12">
      <section className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-center sm:justify-between sm:gap-12 sm:text-left">
        <Avatar className="size-44 shrink-0 sm:order-last sm:size-56 lg:size-72">
          {profile.avatar && (
            <AvatarImage
              src={profile.avatar}
              alt={`${profile.name} 프로필 사진`}
            />
          )}
          <AvatarFallback className="text-6xl sm:text-7xl lg:text-8xl">
            {profile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight break-words sm:text-4xl">
            {profile.name}
          </h1>
          <p className="text-lg break-words text-muted-foreground">
            {profile.tagline}
          </p>
          <p className="break-words whitespace-pre-wrap">{profile.bio}</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Button
              nativeButton={false}
              render={<a href={`mailto:${profile.email}`} />}
            >
              이메일
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={
                <a href={profile.github} target="_blank" rel="noreferrer" />
              }
            >
              GitHub
              <span className="sr-only">(새 탭에서 열림)</span>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="shortcuts-heading" className="space-y-4">
        <h2 id="shortcuts-heading" className="text-xl font-semibold">
          바로가기
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {shortcuts.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="block h-full">
                <Card className="h-full transition-colors hover:bg-muted">
                  <CardHeader>
                    <CardTitle>{item.label}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="projects-heading" className="space-y-4">
        <h2 id="projects-heading" className="text-xl font-semibold">
          대표 프로젝트
        </h2>
        {featuredProjects.length === 0 ? (
          <EmptyState title="아직 등록된 프로젝트가 없습니다" />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featuredProjects.map((project) => (
              <li key={project.name}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="posts-heading" className="space-y-4">
        <h2 id="posts-heading" className="text-xl font-semibold">
          최신 글
        </h2>
        {latestPosts.length === 0 ? (
          <EmptyState title="아직 작성된 글이 없습니다" />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {latestPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
