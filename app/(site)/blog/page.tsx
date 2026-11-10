import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/content/page-header";
import { EmptyState } from "@/components/content/empty-state";
import { PostListSkeleton } from "@/components/blog/post-list-skeleton";
import {
  BLOG_DESCRIPTION,
  buildBlogListMetadata,
} from "@/lib/posts/list-metadata";
import {
  buildBlogHref,
  parseListParams,
  type ListParams,
} from "@/lib/posts/list-params";
import { getPageSize } from "@/lib/posts/page-size";
import { getTotalPages } from "@/lib/posts/pagination";
import {
  getPublishedPostsPage,
  getTaxonomy,
  searchPosts,
} from "@/lib/queries/posts";

import { Pagination } from "./_components/pagination";
import { PostFilterBar } from "./_components/post-filter-bar";
import { PostList } from "./_components/post-list";
import { SearchForm } from "./_components/search-form";
import { TaxonomyFilter } from "./_components/taxonomy-filter";

// searchParams를 읽으므로 메타데이터는 요청 시점에 평가된다. 본문도 Suspense 안에서 요청 시점
// 데이터를 읽어 정적 셸은 그대로이고 메타데이터는 본문과 함께 스트리밍된다. DB 조회는 하지 않는다.
export async function generateMetadata({
  searchParams,
}: PageProps<"/blog">): Promise<Metadata> {
  return buildBlogListMetadata(parseListParams(await searchParams));
}

// 마지막 페이지보다 큰 page로 들어온 경우의 안내. notFound() 대신 200으로 안내와 이동 링크를 준다.
function PageOutOfRange({
  filter,
  totalPages,
}: {
  filter: ListParams;
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
  const parsed = parseListParams(params);
  const { category, tag, q, page = 1 } = parsed;
  // 모바일 6개·그 외 10개. 같은 ?page=n이어도 기기에 따라 담기는 글이 다르다.
  const pageSize = getPageSize(await headers());
  // 검색어가 있으면 검색 RPC(캐시 없음), 없으면 기존 캐시 조회. 1자 검색어는 검색하지 않는다.
  const [{ posts, total }, taxonomy] = await Promise.all([
    q
      ? searchPosts({ q, category, tag, page, pageSize })
      : getPublishedPostsPage({ category, tag, page, pageSize }),
    getTaxonomy(),
  ]);
  const totalPages = getTotalPages(total, pageSize);
  // page를 뺀 현재 조건(검색어 포함). 링크 생성이 이 값을 기준으로 한다.
  const current: ListParams = { ...parsed, page: undefined };

  return (
    <>
      <SearchForm
        current={current}
        total={q ? total : undefined}
        categories={taxonomy.categories}
      />
      <TaxonomyFilter taxonomy={taxonomy} current={current} />
      <PostFilterBar category={category} tag={tag} q={q} />
      {total > 0 && page > totalPages ? (
        <PageOutOfRange filter={current} totalPages={totalPages} />
      ) : (
        <>
          <PostList
            posts={posts}
            filtered={Boolean(category || tag)}
            query={q}
          />
          <Pagination current={current} page={page} totalPages={totalPages} />
        </>
      )}
    </>
  );
}

export default function BlogPage(props: PageProps<"/blog">) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <PageHeader title="블로그" description={BLOG_DESCRIPTION} />
      <Suspense fallback={<PostListSkeleton />}>
        <FilteredPosts searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
