import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/site-url";
import type { Post } from "@/lib/types/post";

type PostMetaSource = Pick<
  Post,
  "title" | "excerpt" | "thumbnail_url" | "published_at" | "updated_at"
>;

/** 글 상세 메타데이터. 글이 없으면 색인을 막는다. */
export function buildPostMetadata(post: PostMetaSource | null): Metadata {
  if (!post) return { robots: { index: false } };

  // 하위 세그먼트가 openGraph/twitter를 지정하면 app/opengraph-image.png 등 파일 기반 이미지가
  // 상속되지 않는 것을 빌드 HTML로 확인했다(2026-10-29). 썸네일이 없으면 기본 이미지를 명시한다.
  const ogImages = [post.thumbnail_url ?? absoluteUrl("/opengraph-image.png")];
  const twitterImages = [
    post.thumbnail_url ?? absoluteUrl("/twitter-image.png"),
  ];

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: twitterImages,
    },
  };
}
