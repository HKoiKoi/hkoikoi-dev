import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import { describe, expect, it } from "vitest";

import { rehypePlugins, remarkPlugins } from "./plugins";
import { sanitizeStyleCss } from "./rehype-sanitize-style";

describe("sanitizeStyleCss", () => {
  it(".post- 와 #user-content- 규칙은 유지한다", () => {
    expect(sanitizeStyleCss(".post-box{color:red;margin:0}")).toBe(
      ".post-box { color: red; margin: 0 }",
    );
    expect(sanitizeStyleCss("#user-content-a{color:blue}")).toBe(
      "#user-content-a { color: blue }",
    );
  });

  it("접두가 다른 전역 선택자 규칙을 제거한다", () => {
    const css = "body{background:red} .post-a{color:red} *{display:none}";
    expect(sanitizeStyleCss(css)).toBe(".post-a { color: red }");
  });

  it("선택자 목록 중 하나라도 허용되지 않으면 규칙 전체를 제거한다", () => {
    expect(sanitizeStyleCss(".post-a, button{display:none}")).toBe("");
  });

  it("position:fixed 전역 선택자 오버레이를 제거한다", () => {
    expect(sanitizeStyleCss("html{position:fixed;inset:0;z-index:9999}")).toBe(
      "",
    );
  });

  it("@import와 모든 @-규칙을 제거한다", () => {
    const css =
      '@import url("https://evil.test/a.css");@import "b.css";@media print{.post-a{color:red}}@font-face{font-family:x}.post-ok{color:red}';
    expect(sanitizeStyleCss(css)).toBe(".post-ok { color: red }");
  });

  it("url(), image-set()이 든 선언을 제거하고 나머지는 남긴다", () => {
    const css =
      ".post-a{color:red;background:URL(https://evil.test/x.png);background-image:image-set('a.png' 1x)}";
    expect(sanitizeStyleCss(css)).toBe(".post-a { color: red }");
  });

  it("이스케이프로 우회한 규칙을 제거한다", () => {
    expect(sanitizeStyleCss(".post-a{background:\\75rl(x)}")).toBe("");
    expect(sanitizeStyleCss(".post-a\\,body{color:red}")).toBe("");
  });

  it("주석 안에 숨긴 구문과 닫히지 않은 주석을 처리한다", () => {
    expect(sanitizeStyleCss("u/**/rl(x) /* x */ .post-a{color:red}")).toBe("");
    expect(sanitizeStyleCss(".post-a{color:red} /* @import")).toBe(
      ".post-a { color: red }",
    );
  });

  it("범위를 벗어나는 선택자(형제, :has, :root)를 제거한다", () => {
    expect(sanitizeStyleCss(".post-a ~ *{display:none}")).toBe("");
    expect(sanitizeStyleCss(".post-a + p{display:none}")).toBe("");
    expect(sanitizeStyleCss(".post-a:has(body){display:none}")).toBe("");
    expect(sanitizeStyleCss(".post-a:root{display:none}")).toBe("");
  });

  it("중첩 규칙과 닫히지 않은 블록을 제거한다", () => {
    expect(sanitizeStyleCss(".post-a{color:red; body{display:none}}")).toBe("");
    expect(sanitizeStyleCss(".post-a{color:red")).toBe("");
  });

  it("커스텀 속성과 자손 선택자는 허용한다", () => {
    expect(sanitizeStyleCss(".post-a p{--gap:4px;margin:var(--gap)}")).toBe(
      ".post-a p { --gap: 4px; margin: var(--gap) }",
    );
  });

  it("빈 입력은 빈 문자열이다", () => {
    expect(sanitizeStyleCss("")).toBe("");
  });
});

describe("마크다운 파이프라인", () => {
  it("본문 <style>의 악성 규칙만 제거하고 정상 규칙과 본문을 유지한다", () => {
    const html = renderToStaticMarkup(
      <Markdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
        {
          '<style>@import url(x.css);body{display:none}.post-a{color:red}</style>\n\n<p class="post-a">본문</p>'
        }
      </Markdown>,
    );
    expect(html).toContain(".post-a { color: red }");
    expect(html).not.toContain("@import");
    expect(html).not.toContain("body");
    expect(html).toContain("본문");
  });
});
