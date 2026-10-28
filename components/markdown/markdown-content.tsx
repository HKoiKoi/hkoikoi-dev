import Markdown from "react-markdown";
import "katex/dist/katex.min.css";

import { rehypePlugins, remarkPlugins } from "@/lib/markdown/plugins";
import { cn } from "@/lib/utils";

// 훅·브라우저 API를 쓰지 않는 동기 컴포넌트라 서버(글 상세)와 클라이언트(편집기 미리보기) 양쪽에서 쓴다.
// 주의: sanitize를 통과한 <style> 태그도 페이지 전체에 적용된다. 글 작성자는 선택자를 post- 접두 class로
// 한정해야 하며, 편집기 미리보기에서 관리자 UI로 새지 않도록 격리하는 일은 Task 016에서 처리한다.
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
