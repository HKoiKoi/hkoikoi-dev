import Markdown from "react-markdown";
import "katex/dist/katex.min.css";

import { CodeBlock } from "@/components/markdown/code-block";
import { createRehypePlugins, remarkPlugins } from "@/lib/markdown/plugins";
import { scopeClassName } from "@/lib/markdown/rehype-scope-style";
import { cn } from "@/lib/utils";

// 훅·브라우저 API를 쓰지 않는 동기 컴포넌트라 서버(글 상세)와 클라이언트(편집기 미리보기) 양쪽에서 쓴다.
// 주의: sanitize를 통과한 <style> 규칙은 선택자 앞에 래퍼 클래스(.post-scope-<scopeId>)가 붙어 이 글 본문
// 안에서만 적용된다. rehypeSanitizeStyle이 .post-·#user-content- 로 시작하지 않는 규칙과 @-규칙·url()을
// 먼저 제거하므로 작성자는 선택자를 그 접두로 한정해야 한다. 사이트 클래스(.post-content 등)는 래퍼 자신에게
// 매칭되지 않아 영향받지 않는다. 편집기 미리보기는 추가로 Shadow DOM(markdown-preview.tsx)으로 격리된다.
// scopeId는 글마다 달라야 하므로 글 상세는 post.id, 미리보기는 고정 값을 넘긴다.
type MarkdownContentProps = {
  content: string;
  scopeId: string;
  className?: string;
};

export function MarkdownContent({
  content,
  scopeId,
  className,
}: MarkdownContentProps) {
  return (
    <div
      className={cn(
        "post-content prose max-w-none break-words dark:prose-invert",
        scopeClassName(scopeId),
        className,
      )}
    >
      <Markdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={createRehypePlugins(scopeId)}
        components={{
          pre: CodeBlock,
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
