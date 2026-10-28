import Markdown from "react-markdown";
import "katex/dist/katex.min.css";

import { rehypePlugins, remarkPlugins } from "@/lib/markdown/plugins";
import { cn } from "@/lib/utils";

// 훅·브라우저 API를 쓰지 않는 동기 컴포넌트라 서버(글 상세)와 클라이언트(편집기 미리보기) 양쪽에서 쓴다.
// 주의: sanitize를 통과한 <style> 태그는 글 상세 페이지에서 페이지 전체에 적용된다. 글 작성자는 선택자를
// post- 접두 class로 한정해야 한다. 편집기 미리보기는 Shadow DOM(markdown-preview.tsx)으로 격리돼 관리자 UI로 새지 않는다.
type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "post-content prose max-w-none break-words dark:prose-invert",
        className,
      )}
    >
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        components={{
          // 본문 이미지는 임의 외부 URL이라 next/image를 쓸 수 없다.
          img: ({ node: _node, alt, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" alt={alt ?? ""} {...props} />
          ),
          a: ({ node: _node, href, ...props }) => (
            <a
              href={href}
              {...(href && /^https?:\/\//i.test(href)
                ? { rel: "noreferrer" }
                : {})}
              {...props}
            />
          ),
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
