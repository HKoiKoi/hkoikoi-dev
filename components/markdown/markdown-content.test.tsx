import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownContent } from "./markdown-content";

function renderMd(content: string) {
  return render(<MarkdownContent content={content} />).container;
}

describe("MarkdownContent 렌더링", () => {
  it("표를 table로 렌더링한다", () => {
    const c = renderMd("| a | b |\n| - | - |\n| 1 | 2 |");
    expect(c.querySelector("table")).not.toBeNull();
  });

  it("인라인 수식을 .katex로 렌더링한다", () => {
    expect(renderMd("$a^2$").querySelector(".katex")).not.toBeNull();
  });

  it("$$ 블록 수식을 렌더링한다", () => {
    expect(
      renderMd("$$\na^2+b^2\n$$").querySelector(".katex-display"),
    ).not.toBeNull();
  });

  it("코드 블록에 hljs 토큰을 붙인다", () => {
    const c = renderMd("```ts\nconst a = 1\n```");
    expect(c.querySelector("code.hljs")).not.toBeNull();
    expect(c.querySelector('[class*="hljs-"]')).not.toBeNull();
  });

  it("취소선을 del로 렌더링한다", () => {
    expect(renderMd("~~x~~").querySelector("del")).not.toBeNull();
  });

  it("체크리스트를 disabled checkbox로 렌더링한다", () => {
    const box = renderMd("- [x] done").querySelector('input[type="checkbox"]');
    expect(box).not.toBeNull();
    expect(box).toBeDisabled();
  });

  it("details/summary와 figure/figcaption을 유지한다", () => {
    const c = renderMd(
      '<details><summary>s</summary>body</details>\n\n<figure><img src="/a.png" alt="a"><figcaption>cap</figcaption></figure>',
    );
    expect(c.querySelector("details summary")).not.toBeNull();
    expect(c.querySelector("figure figcaption")).not.toBeNull();
  });

  it("래퍼에 post-content prose class가 붙는다", () => {
    const c = renderMd("x");
    expect(c.firstElementChild).toHaveClass("post-content", "prose");
  });
});

describe("MarkdownContent 링크·이미지", () => {
  it("외부 링크에 rel noreferrer를 붙인다", () => {
    const a = renderMd("[x](https://example.com)").querySelector("a");
    expect(a).toHaveAttribute("rel", "noreferrer");
  });

  it("내부 링크에는 rel을 붙이지 않는다", () => {
    expect(renderMd("[x](/blog)").querySelector("a")).not.toHaveAttribute(
      "rel",
    );
  });

  it("이미지에 loading lazy를 붙인다", () => {
    const img = renderMd("![alt](https://example.com/a.png)").querySelector(
      "img",
    );
    expect(img).toHaveAttribute("loading", "lazy");
  });
});

describe("MarkdownContent sanitize", () => {
  it("style 요소와 post- class를 유지한다", () => {
    const c = renderMd(
      '<style>.post-box{color:red}</style><div class="post-box">x</div>',
    );
    expect(c.querySelector("style")).not.toBeNull();
    expect(c.querySelector("div.post-box")).not.toBeNull();
  });

  it("script를 제거한다", () => {
    const c = renderMd("<script>alert(1)</script>");
    expect(c.querySelector("script")).toBeNull();
  });

  it("img의 onerror를 제거한다", () => {
    const img = renderMd('<img src="x" onerror="alert(1)">').querySelector(
      "img",
    );
    expect(img).not.toBeNull();
    expect(img).not.toHaveAttribute("onerror");
  });

  it("javascript: href를 제거한다", () => {
    const a = renderMd("[a](javascript:alert(1))").querySelector("a");
    expect(a?.getAttribute("href") ?? null).toBeNull();
  });

  it("class 'evil post-ok'에서 post-ok만 남긴다", () => {
    const el = renderMd('<div class="evil post-ok">x</div>').querySelector(
      "div.post-ok",
    );
    expect(el).not.toBeNull();
    expect(el?.className).toBe("post-ok");
  });

  it("id에 user-content- 접두를 붙인다", () => {
    const c = renderMd('<div id="intro">x</div>');
    expect(c.querySelector("#user-content-intro")).not.toBeNull();
    expect(c.querySelector("#intro")).toBeNull();
  });
});

describe("MarkdownContent 엣지", () => {
  it("미완성 수식도 예외 없이 렌더링한다", () => {
    expect(() => renderMd("$\\frac{1}{")).not.toThrow();
  });

  it("미지원 언어 코드 블록도 예외 없이 렌더링한다", () => {
    const c = renderMd("```foobar\nx\n```");
    expect(c.querySelector("pre code")).not.toBeNull();
  });
});
