import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/content/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { PostListSkeleton } from "@/components/blog/post-list-skeleton";
import { buildBlogHref, parseListParams } from "@/lib/posts/list-params";
import { getPageSize } from "@/lib/posts/page-size";
import { getTotalPages } from "@/lib/posts/pagination";
import { getPublishedPostsPage, getTaxonomy } from "@/lib/queries/posts";

import { Pagination } from "./_components/pagination";
import { PostFilterBar } from "./_components/post-filter-bar";
import { PostList } from "./_components/post-list";
import { TaxonomyFilter } from "./_components/taxonomy-filter";

export const metadata: Metadata = {
  title: "블로그",
  description: "개발과 일상에 대한 글을 모아둔 블로그입니다.",
};

// 마지막 페이지보다 큰 page로 들어온 경우의 안내. notFound() 대신 200으로 안내와 이동 링크를 준다.
function PageOutOfRange({
  filter,
  totalPages,
}: {
  filter: { category?: string; tag?: string };
  totalPages: number;
}) {
  const linkClass = "underline underline-offset-4 hover:text-foreground";
  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        title="없는 페이지입니다"
        message={`글 목록은 ${totalPages}페이지까지 있습니다.`}
      />
      <p className="flex justify-center gap-4 text-sm text-muted-foreground">
        <Link href={buildBlogHref(filter, { page: 1 })} className={linkClass}>
          첫 페이지로
        </Link>
        <Link
          href={buildBlogHref(filter, { page: totalPages })}
          className={linkClass}
        >
          마지막 페이지로
        </Link>
      </p>
    </div>
  );
}

// searchParams는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function FilteredPosts({
  searchParams,
}: Pick<PageProps<"/blog">, "searchParams">) {
  const params = await searchParams;
  const { category, tag, page = 1 } = parseListParams(params);
  // 모바일 6개·그 외 10개. 같은 ?page=n이어도 기기에 따라 담기는 글이 다르다.
  const pageSize = getPageSize(await headers());
  const [{ posts, total }, taxonomy] = await Promise.all([
    getPublishedPostsPage({ category, tag, page, pageSize }),
    getTaxonomy(),
  ]);
  const totalPages = getTotalPages(total, pageSize);
  const filter = { category, tag };

  return (
    <>
      <TaxonomyFilter taxonomy={taxonomy} current={filter} />
      <PostFilterBar category={category} tag={tag} />
      {total > 0 && page > totalPages ? (
        <PageOutOfRange filter={filter} totalPages={totalPages} />
      ) : (
        <>
          <PostList posts={posts} filtered={Boolean(category || tag)} />
          <Pagination current={filter} page={page} totalPages={totalPages} />
        </>
      )}
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
