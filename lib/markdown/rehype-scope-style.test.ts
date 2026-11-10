import { describe, expect, it } from "vitest";
import {
  rehypeScopeStyle,
  scopeClassName,
  scopeCss,
} from "./rehype-scope-style";

describe("scopeClassName", () => {
  it("허용 문자 외에는 -로 치환한다", () => {
    expect(scopeClassName("abc")).toBe("post-scope-abc");
    expect(scopeClassName("a b.c'd\"e")).toBe("post-scope-a-b-c-d-e");
  });

  it("uuid 값은 그대로 유지한다", () => {
    const id = "05b064e0-a9f7-4879-afa0-0fbebf2190f8";
    expect(scopeClassName(id)).toBe(`post-scope-${id}`);
  });
});

describe("scopeCss", () => {
  it(".post-box를 래퍼 하위로 한정한다", () => {
    expect(scopeCss(".post-box { color: red }", "abc")).toBe(
      ".post-scope-abc .post-box { color: red }",
    );
  });

  it("선택자 목록의 각 선택자에 접두한다", () => {
    expect(scopeCss(".post-a, .post-b { color: red }", "abc")).toBe(
      ".post-scope-abc .post-a, .post-scope-abc .post-b { color: red }",
    );
  });

  it("#user-content- 선택자에도 접두한다", () => {
    expect(scopeCss("#user-content-intro { margin: 0 }", "abc")).toBe(
      ".post-scope-abc #user-content-intro { margin: 0 }",
    );
  });

  it("여러 규칙을 줄바꿈으로 잇는다", () => {
    expect(
      scopeCss(".post-a { color: red } .post-b { color: blue }", "x"),
    ).toBe(
      ".post-scope-x .post-a { color: red }\n.post-scope-x .post-b { color: blue }",
    );
  });

  it("빈 입력·빈 prelude·빈 선택자·주석을 예외 없이 처리한다", () => {
    expect(scopeCss("", "abc")).toBe("");
    expect(scopeCss("   ", "abc")).toBe("");
    expect(scopeCss("{ color: red }", "abc")).toBe("");
    expect(scopeCss(", { color: red }", "abc")).toBe("");
    expect(scopeCss("/* 주석 */", "abc")).toBe("");
    expect(scopeCss("/* 닫히지 않은 주석", "abc")).toBe("");
    expect(scopeCss("/* a */ .post-a /* b */ { color: red }", "abc")).toBe(
      ".post-scope-abc .post-a { color: red }",
    );
  });

  it("@-규칙과 닫히지 않은 블록은 남기지 않는다", () => {
    expect(scopeCss("@import 'x'; .post-a { color: red }", "abc")).toBe(
      ".post-scope-abc .post-a { color: red }",
    );
    expect(scopeCss("@media print { .post-a { color: red } }", "abc")).toBe("");
    expect(scopeCss(".post-a { color: red", "abc")).toBe("");
  });

  it("scopeId를 정규화해 접두한다", () => {
    expect(scopeCss(".post-a { color: red }", "a b.c")).toBe(
      ".post-scope-a-b-c .post-a { color: red }",
    );
  });

  it("uuid scopeId를 그대로 쓴다", () => {
    const id = "05b064e0-a9f7-4879-afa0-0fbebf2190f8";
    expect(scopeCss(".post-a { color: red }", id)).toBe(
      `.post-scope-${id} .post-a { color: red }`,
    );
  });
});

describe("rehypeScopeStyle", () => {
  it("style 요소의 text·raw 자식만 변환한다", () => {
    const tree = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "style",
          children: [
            { type: "text", value: ".post-a { color: red }" },
            { type: "raw", value: ".post-b { color: blue }" },
          ],
        },
        {
          type: "element",
          tagName: "p",
          children: [{ type: "text", value: ".post-a { color: red }" }],
        },
      ],
    };
    rehypeScopeStyle({ scopeId: "abc" })(tree);
    expect(tree.children[0].children?.map((c) => c.value)).toEqual([
      ".post-scope-abc .post-a { color: red }",
      ".post-scope-abc .post-b { color: blue }",
    ]);
    expect(tree.children[1].children?.[0].value).toBe(".post-a { color: red }");
  });
});
