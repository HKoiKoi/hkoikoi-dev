import { Suspense } from "react";

// params는 퍼센트 인코딩된 채로 전달되므로(한글 슬러그 등) 직접 디코딩한다.
// 잘못된 인코딩(URIError)이면 원문을 그대로 쓴다.
function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

// params는 요청 시점 데이터이므로 Suspense 안에서 await한다 (cacheComponents).
async function BlogPostTitle({
  params,
}: Pick<PageProps<"/blog/[slug]">, "params">) {
  const { slug } = await params;
  const title = decodeSlug(slug);

  return <h1 className="text-2xl font-semibold">{title}</h1>;
}

export default function BlogPostPage(props: PageProps<"/blog/[slug]">) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Suspense fallback={<h1 className="text-2xl font-semibold">블로그</h1>}>
        <BlogPostTitle params={props.params} />
      </Suspense>
    </main>
  );
}
