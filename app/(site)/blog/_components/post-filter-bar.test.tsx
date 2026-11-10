import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostFilterBar } from "./post-filter-bar";

describe("PostFilterBar", () => {
  it("필터가 없으면 렌더링하지 않는다", () => {
    const { container } = render(<PostFilterBar q="캐시" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("필터 해제는 /blog로 이동한다", () => {
    render(<PostFilterBar category="개발" tag="nextjs" />);

    expect(screen.getByRole("link", { name: "필터 해제" })).toHaveAttribute(
      "href",
      "/blog",
    );
  });

  it("필터 해제는 검색어를 유지한다", () => {
    render(<PostFilterBar category="개발" q="캐시" />);

    expect(screen.getByRole("link", { name: "필터 해제" })).toHaveAttribute(
      "href",
      `/blog?q=${encodeURIComponent("캐시")}`,
    );
  });
});
