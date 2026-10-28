import type { ComponentPropsWithoutRef } from "react";
import type { ExtraProps } from "react-markdown";

import { CodeCopyButton } from "@/components/markdown/code-copy-button";

// react-markdown의 pre 오버라이드. 서버/클라이언트 양쪽에서 쓰이도록 훅 없이 구성하고
// 상호작용은 CodeCopyButton(클라이언트)에만 둔다. 버튼은 pre와 같은 wrapper 안에서 우상단에 놓인다.
export function CodeBlock({
  node: _node,
  ...props
}: ComponentPropsWithoutRef<"pre"> & ExtraProps) {
  return (
    <div className="relative my-[1.7em]">
      <pre {...props} className="my-0" />
      <CodeCopyButton />
    </div>
  );
}
