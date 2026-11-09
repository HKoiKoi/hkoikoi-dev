import type { Metadata } from "next";
import { Suspense } from "react";

import { PageHeader } from "@/components/content/page-header";
import { PostListSkeleton } from "@/components/blog/post-list-skeleton";
import { parseListParams } from "@/lib/posts/list-params";
import { getPublishedPosts, getTaxonomy } from "@/lib/queries/posts";

import { PostFilterBar } from "./_components/post-filter-bar";
import { PostList } from "./_components/post-list";
import { TaxonomyFilter } from "./_components/taxonomy-filter";

export const metadata: Metadata = {
  title: "블로그",
  description: "개발과 일상에 대한 글을 모아둔 블로그입니다.",
};

// searchParams는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function FilteredPosts({
  searchParams,
}: Pick<PageProps<"/blog">, "searchParams">) {
  const params = await searchParams;
  const { category, tag } = parseListParams(params);
  const [posts, taxonomy] = await Promise.all([
    getPublishedPosts({ category, tag }),
    getTaxonomy(),
  ]);

  return (
    <>
      <TaxonomyFilter taxonomy={taxonomy} current={{ category, tag }} />
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
      <Suspense fallback={<PostListSkeleton />}>
        <FilteredPosts searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
