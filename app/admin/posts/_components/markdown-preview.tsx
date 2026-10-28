"use client";

import { Component, useDeferredValue, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";

import { MarkdownContent } from "@/components/markdown/markdown-content";
import { cn } from "@/lib/utils";

// 글 본문의 <style>이 편집기 UI로 새지 않도록 Shadow DOM으로 미리보기를 격리한다.
// - 같은 React 트리 안에서 portal로 렌더링하므로 MarkdownContent를 그대로 재사용하고 상세 페이지와 결과가 같다.
// - 문서의 스타일시트(Tailwind·typography·KaTeX·hljs)는 shadow 안에 적용되지 않아 복제해서 주입한다.
//   복제할 때 :root 선택자는 shadow 내부 요소에 매칭되지 않으므로 :host로 치환해 CSS 변수를 정의한다.
// - .dark 선택자는 shadow 경계를 넘지 못하므로, 테마가 dark면 shadow 안 래퍼 div에 dark 클래스를 직접 준다.
// - SSR에서는 빈 호스트만 렌더링하고 shadow root는 마운트 후에 만든다(hydration 불일치 방지).
// 한계: 스타일은 마운트 시점에 한 번만 복제한다(개발 중 HMR로 바뀐 CSS는 새로고침해야 반영).
// @font-face·@property는 shadow 안에서 동작하지 않지만 문서에 이미 등록돼 있어 KaTeX 글꼴은 그대로 쓰인다.

type MarkdownPreviewProps = {
  content: string;
};

const PLACEHOLDER = "본문을 입력하면 여기에 표시됩니다";
const FALLBACK_STYLE_ATTR = "data-preview-style";
const CSS_IMPORT_RULE = 3;

// 시트의 규칙 텍스트를 모으되 :root를 :host로 바꾼다. 읽을 수 없는 시트(cross-origin)는 null.
function readSheetCss(sheet: CSSStyleSheet): string | null {
  try {
    return Array.from(sheet.cssRules)
      .filter((rule) => rule.type !== CSS_IMPORT_RULE)
      .map((rule) => rule.cssText.replace(/:root\b/g, ":host"))
      .join("\n");
  } catch {
    return null;
  }
}

function supportsAdoptedStyleSheets(): boolean {
  return (
    typeof CSSStyleSheet !== "undefined" &&
    "replaceSync" in CSSStyleSheet.prototype &&
    "adoptedStyleSheets" in Document.prototype
  );
}

function injectDocumentStyles(shadowRoot: ShadowRoot) {
  const cssTexts = Array.from(document.styleSheets)
    .map(readSheetCss)
    .filter((css): css is string => css !== null);

  if (supportsAdoptedStyleSheets()) {
    shadowRoot.adoptedStyleSheets = cssTexts.map((css) => {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return sheet;
    });
    return;
  }

  // 폴백: <style> 텍스트 복제. effect 재실행 시 중복되지 않도록 이전 것을 지운다.
  shadowRoot
    .querySelectorAll(`style[${FALLBACK_STYLE_ATTR}]`)
    .forEach((el) => el.remove());
  for (const css of cssTexts) {
    const style = document.createElement("style");
    style.setAttribute(FALLBACK_STYLE_ATTR, "");
    style.textContent = css;
    shadowRoot.prepend(style);
  }
}

type PreviewErrorBoundaryProps = {
  resetKey: string;
  children: ReactNode;
};

// 미완성 마크다운 등으로 렌더링이 실패해도 편집기 전체가 깨지지 않게 한다.
class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("미리보기 렌더링 실패", error, info.componentStack);
  }

  // content가 바뀌면 다시 시도한다.
  componentDidUpdate(prevProps: PreviewErrorBoundaryProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <p role="alert" className="text-sm text-destructive">
          미리보기를 표시할 수 없습니다
        </p>
      );
    }
    return this.props.children;
  }
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const { resolvedTheme } = useTheme();
  // 입력은 즉시 반영하고 마크다운 렌더링은 낮은 우선순위로 처리한다.
  const deferredContent = useDeferredValue(content);

  useEffect(() => {
    if (shadowRoot) injectDocumentStyles(shadowRoot);
  }, [shadowRoot]);

  return (
    // 호스트(:host): 가로 넘침만 스스로 스크롤하고 세로 스크롤은 바깥 요소가 맡는다.
    // contain: paint로 본문 <style>의 position: fixed 등이 호스트 밖을 덮지 못하게 가둔다.
    <div
      className="block max-w-full min-w-0 overflow-x-auto [contain:paint]"
      ref={(el) => {
        if (!el) return;
        // StrictMode 등으로 ref가 다시 호출돼도 shadow root는 한 번만 만든다.
        setShadowRoot(el.shadowRoot ?? el.attachShadow({ mode: "open" }));
      }}
    >
      {shadowRoot
        ? createPortal(
            <div
              className={cn(
                // html·body 규칙은 shadow 안에 적용되지 않아 래퍼에 직접 지정한다.
                "font-sans text-card-foreground",
                resolvedTheme === "dark" && "dark",
              )}
            >
              <div className="min-w-0 p-4 sm:p-6 [&_.katex-display]:overflow-x-auto [&_img]:h-auto [&_img]:max-w-full [&_table]:block [&_table]:overflow-x-auto">
                {deferredContent.trim() === "" ? (
                  <p className="text-sm text-muted-foreground">{PLACEHOLDER}</p>
                ) : (
                  <PreviewErrorBoundary resetKey={deferredContent}>
                    <MarkdownContent content={deferredContent} />
                  </PreviewErrorBoundary>
                )}
              </div>
            </div>,
            shadowRoot,
          )
        : null}
    </div>
  );
}
