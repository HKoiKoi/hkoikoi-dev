import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryBadge } from "@/components/blog/category-badge";
import { TagBadge } from "@/components/blog/tag-badge";
import { formatDate } from "@/lib/format-date";
import { getPostBySlug } from "@/lib/queries/posts";

// params는 퍼센트 인코딩된 채로 전달되므로(한글 슬러그 등) 직접 디코딩한다.
// 잘못된 인코딩(URIError)이면 원문을 그대로 쓴다.
function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

// 본문과 같은 원시값으로 호출해 React cache로 DB 조회를 한 번만 한다.
export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeSlug(slug));
  return post ? { title: post.title, description: post.excerpt } : {};
}

// params는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function BlogPost({ params }: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const post = await getPostBySlug(decodeSlug(slug));
  if (!post) notFound();

  const date = post.published_at ?? post.created_at;

  return (
    <article className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={post.category} />
          <time dateTime={date} className="text-sm text-muted-foreground">
            {formatDate(date)}
          </time>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-3xl">
          {post.title}
        </h1>
        {post.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="태그">
            {post.tags.map((tag) => (
              <li key={tag}>
                <TagBadge tag={tag} />
              </li>
            ))}
          </ul>
        )}
      </header>
      {/* TODO: Task 015에서 MarkdownContent로 교체한다 (임시 본문) */}
      <div className="break-words whitespace-pre-wrap">{post.content}</div>
    </article>
  );
}

export default function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <Suspense
        fallback={<p className="text-muted-foreground">불러오는 중…</p>}
      >
        <BlogPost params={props.params} />
      </Suspense>
    </div>
  );
}
