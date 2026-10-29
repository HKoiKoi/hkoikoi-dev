import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("span의 color hex style은 유지한다", () => {
    const span = renderMd(
      '<span style="color: #A78BFA">x</span>',
    ).querySelector("span");
    expect(span).toHaveStyle({ color: "#A78BFA" });
  });

  it("span의 color 외 style은 제거한다", () => {
    const c = renderMd(
      '<span style="color: red; position: fixed">x</span><span style="background: url(x)">y</span>',
    );
    expect(c.querySelectorAll("span[style]")).toHaveLength(0);
  });

  it("span 외 요소의 style은 제거한다", () => {
    expect(
      renderMd('<div style="color: #fff">x</div>').querySelector("[style]"),
    ).toBeNull();
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

describe("MarkdownContent 코드 복사 버튼", () => {
  it("펜스의 언어를 헤더 줄에 라벨로 표시한다", () => {
    const c = renderMd("```ts\nconst a = 1\n```");
    expect(c.querySelector("[data-code-block] span")?.textContent).toBe("ts");
  });

  it("알려진 언어는 라벨 앞 점에 언어색을 칠하고 모르는 언어는 칠하지 않는다", () => {
    const known = renderMd("```ts\nconst a = 1\n```");
    const dot = known.querySelector<HTMLElement>(
      "[data-code-block] [aria-hidden]",
    );
    expect(dot?.style.backgroundColor).toBe("rgb(49, 120, 198)");
    const unknown = renderMd("```foolang\nx\n```");
    expect(
      unknown.querySelector<HTMLElement>("[data-code-block] [aria-hidden]")
        ?.style.backgroundColor,
    ).toBe("");
  });

  it("언어가 없으면 라벨은 비어 있고 복사 버튼은 유지된다", () => {
    const c = renderMd("```\nplain\n```");
    expect(c.querySelector("[data-code-block] span")?.textContent).toBe("");
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeVisible();
  });

  it("코드 블록마다 복사 버튼을 렌더링한다", () => {
    renderMd("```ts\nconst a = 1\n```");
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeVisible();
  });

  it("클릭하면 개행을 뺀 순수 텍스트를 클립보드에 쓰고 복사됨으로 바꾼다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderMd("```ts\nconst a = 1\n```");
    fireEvent.click(screen.getByRole("button", { name: "코드 복사" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "코드 복사됨" })).toBeVisible(),
    );
    expect(writeText).toHaveBeenCalledWith("const a = 1");
  });

  it("클립보드 쓰기가 실패해도 예외 없이 상태를 유지한다", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    renderMd("```\nx\n```");
    fireEvent.click(screen.getByRole("button", { name: "코드 복사" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole("button", { name: "코드 복사" })).toBeVisible();
  });
});
