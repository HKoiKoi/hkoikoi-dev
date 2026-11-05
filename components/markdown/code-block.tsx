import { isValidElement, type ComponentPropsWithoutRef } from "react";
import type { ExtraProps } from "react-markdown";

import { CodeCopyButton } from "@/components/markdown/code-copy-button";

// 라벨 앞 점의 색(GitHub 언어색 기준, 어두운 색은 다크 테마에서 보이도록 밝게 조정). 별칭은 같은 색으로 묶고,
// 없는 언어는 점을 muted 색으로 둔다.
const LANGUAGE_COLORS: Record<string, string> = {
  ts: "#3178c6",
  typescript: "#3178c6",
  tsx: "#3178c6",
  js: "#f1e05a",
  javascript: "#f1e05a",
  jsx: "#f1e05a",
  python: "#3572a5",
  py: "#3572a5",
  bash: "#89e051",
  sh: "#89e051",
  shell: "#89e051",
  zsh: "#89e051",
  json: "#d4a017",
  sql: "#e38c00",
  css: "#8b5cf6",
  html: "#e34c26",
  yaml: "#cb171e",
  yml: "#cb171e",
  markdown: "#519aba",
  md: "#519aba",
  go: "#00add8",
  rust: "#dea584",
  java: "#b07219",
};

// 펜스 코드의 언어는 rehype-highlight가 code 요소에 붙인 language-* 클래스에서 읽는다.
function getLanguage(children: React.ReactNode): string | null {
  if (!isValidElement<{ className?: string }>(children)) return null;
  const className = children.props.className;
  return (
    (typeof className === "string" &&
      /(?:^|\s)language-(\S+)/.exec(className)?.[1]) ||
    null
  );
}

// react-markdown의 pre 오버라이드. 서버/클라이언트 양쪽에서 쓰이도록 훅 없이 구성하고
// 상호작용은 CodeCopyButton(클라이언트)에만 둔다. 언어 라벨과 복사 버튼은 pre 위 헤더 줄에 두어
// 코드와 겹치지 않게 한다.
export function CodeBlock({
  node: _node,
  children,
  ...props
}: ComponentPropsWithoutRef<"pre"> & ExtraProps) {
  const language = getLanguage(children);

  return (
    <div
      data-code-block
      className="my-[1.7em] overflow-hidden rounded-lg bg-muted"
    >
      <div className="not-prose flex items-center justify-between gap-2 border-b border-border/60 py-1 pr-1.5 pl-3">
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
          {language && (
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-muted-foreground/40"
              style={{
                backgroundColor: LANGUAGE_COLORS[language.toLowerCase()],
              }}
            />
          )}
          {language}
        </span>
        <CodeCopyButton />
      </div>
      <pre {...props} className="my-0 rounded-none">
        {children}
      </pre>
    </div>
  );
}
