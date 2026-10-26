import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/content/page-header";
import { dummyPosts } from "@/lib/dummy/posts";
import { filterPosts } from "@/lib/posts/filter";

import { PostFilterBar } from "./_components/post-filter-bar";
import { PostList } from "./_components/post-list";

export const metadata: Metadata = {
  title: "블로그",
  description: "개발과 일상에 대한 글을 모아둔 블로그입니다.",
};

// 같은 키가 여러 번 오면 첫 값을 사용한다.
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

// searchParams는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function FilteredPosts({
  searchParams,
}: Pick<PageProps<"/blog">, "searchParams">) {
  const params = await searchParams;
  const category = first(params.category) || undefined;
  const tag = first(params.tag) || undefined;
  const posts = filterPosts(dummyPosts, { category, tag });

  return (
    <>
      <PostFilterBar category={category} tag={tag} />
      <PostList posts={posts} filtered={Boolean(category || tag)} />
    </>
  );
}

export default function BlogPage(props: PageProps<"/blog">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <PageHeader
        title="블로그"
        description="개발과 일상에 대한 글을 모아둔 블로그입니다."
      />
      <Suspense
        fallback={<p className="text-muted-foreground">불러오는 중…</p>}
      >
        <FilteredPosts searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
