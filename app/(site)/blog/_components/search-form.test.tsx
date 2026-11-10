import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SearchForm } from "./search-form";

describe("SearchForm", () => {
  it("GET 폼으로 /blog에 제출하고 검색 영역 이름과 입력 라벨을 둔다", () => {
    render(<SearchForm current={{}} />);

    const form = screen.getByRole("search");
    expect(form).toHaveAttribute("action", "/blog");
    expect(form).toHaveAttribute("method", "get");
    const input = screen.getByLabelText("블로그 검색");
    expect(input).toHaveAttribute("name", "q");
    expect(input).toHaveAttribute("maxlength", "50");
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/blog",
    );
  });

  it("category·tag는 hidden으로 유지하고 page는 넣지 않는다", () => {
    const { container } = render(
      <SearchForm current={{ category: "개발", tag: "nextjs", page: 2 }} />,
    );

    expect(container.querySelector('input[name="category"]')).toHaveValue(
      "개발",
    );
    expect(container.querySelector('input[name="tag"]')).toHaveValue("nextjs");
    expect(container.querySelector('input[name="page"]')).toBeNull();
  });

  it("검색 중이면 입력값·결과 수·초기화 링크를 보여 준다", () => {
    render(<SearchForm current={{ q: "캐시", category: "개발" }} total={3} />);

    expect(screen.getByLabelText("블로그 검색")).toHaveValue("캐시");
    expect(screen.getByRole("status")).toHaveTextContent("검색 결과 3개");
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      `/blog?category=${encodeURIComponent("개발")}`,
    );
  });

  it("1자 검색어는 원문을 입력창에 되살리고 안내만 보여 준다", () => {
    render(<SearchForm current={{ qTooShort: true, rawQ: "a" }} />);

    expect(screen.getByLabelText("블로그 검색")).toHaveValue("a");
    expect(screen.getByRole("status")).toHaveTextContent("두 글자 이상");
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/blog",
    );
  });
});
