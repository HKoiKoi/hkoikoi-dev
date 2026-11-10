import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchForm } from "./search-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const CATEGORIES = [
  { name: "개발", count: 3 },
  { name: "일상", count: 1 },
];

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

  it("카테고리 select는 기본값이 전체이고 글 수를 함께 보여 준다", () => {
    render(<SearchForm current={{}} categories={CATEGORIES} />);

    const select = screen.getByLabelText("카테고리");
    expect(select).toHaveValue("");
    expect(
      Array.from((select as HTMLSelectElement).options).map((o) => o.text),
    ).toEqual(["전체", "개발 (3)", "일상 (1)"]);
  });

  it("현재 카테고리를 선택해 두고 tag는 hidden으로 유지하며 page는 넣지 않는다", () => {
    const { container } = render(
      <SearchForm
        current={{ category: "개발", tag: "nextjs", page: 2 }}
        categories={CATEGORIES}
      />,
    );

    expect(screen.getByLabelText("카테고리")).toHaveValue("개발");
    expect(container.querySelector('input[name="tag"]')).toHaveValue("nextjs");
    expect(container.querySelector('input[name="page"]')).toBeNull();
  });

  it("카테고리를 바꾸면 입력 중인 검색어·태그를 유지하고 이동한다", () => {
    render(<SearchForm current={{ tag: "nextjs" }} categories={CATEGORIES} />);
    fireEvent.change(screen.getByLabelText("블로그 검색"), {
      target: { value: "캐시" },
    });

    fireEvent.change(screen.getByLabelText("카테고리"), {
      target: { value: "개발" },
    });

    expect(push).toHaveBeenLastCalledWith(
      `/blog?category=${encodeURIComponent("개발")}&tag=nextjs&q=${encodeURIComponent("캐시")}`,
    );

    fireEvent.change(screen.getByLabelText("카테고리"), {
      target: { value: "" },
    });
    expect(push).toHaveBeenLastCalledWith(
      `/blog?tag=nextjs&q=${encodeURIComponent("캐시")}`,
    );
  });

  it("검색 중이면 입력값·결과 수를 보여 주고, 초기화 링크는 카테고리 필터까지 풀어 /blog로 보낸다 보여 준다", () => {
    render(
      <SearchForm
        current={{ q: "캐시", category: "개발" }}
        total={3}
        categories={CATEGORIES}
      />,
    );

    expect(screen.getByLabelText("블로그 검색")).toHaveValue("캐시");
    expect(screen.getByRole("status")).toHaveTextContent("검색 결과 3개");
    expect(screen.getByRole("link", { name: "초기화" })).toHaveAttribute(
      "href",
      "/blog",
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
