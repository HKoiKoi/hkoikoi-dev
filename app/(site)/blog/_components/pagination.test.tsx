import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pagination } from "./pagination";

describe("Pagination", () => {
  it("총 페이지가 1 이하면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(
      <Pagination current={{}} page={1} totalPages={1} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("aria-current=page는 현재 번호에만 붙는다", () => {
    render(<Pagination current={{ page: 3 }} page={3} totalPages={5} />);

    const currents = document.querySelectorAll('[aria-current="page"]');
    expect(currents).toHaveLength(1);
    expect(currents[0]).toBe(screen.getByRole("link", { name: "3페이지" }));
  });

  it("첫 페이지: 이전은 비활성, 다음은 2페이지 링크", () => {
    render(<Pagination current={{}} page={1} totalPages={5} />);

    expect(screen.queryByRole("link", { name: "이전 페이지" })).toBeNull();
    expect(screen.getByText("이전").closest("span")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "다음 페이지" })).toHaveAttribute(
      "href",
      "/blog?page=2",
    );
  });

  it("마지막 페이지: 다음은 비활성, 이전은 링크", () => {
    render(<Pagination current={{ page: 5 }} page={5} totalPages={5} />);

    expect(screen.queryByRole("link", { name: "다음 페이지" })).toBeNull();
    expect(screen.getByText("다음").closest("span")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(screen.getByRole("link", { name: "이전 페이지" })).toHaveAttribute(
      "href",
      "/blog?page=4",
    );
  });

  it("카테고리·태그를 모든 링크에 유지하고 1페이지는 page 쿼리가 없다", () => {
    render(
      <Pagination
        current={{ category: "개발", tag: "react", page: 2 }}
        page={2}
        totalPages={3}
      />,
    );

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain("category=");
      expect(href).toContain("tag=react");
    }
    const first = screen.getByRole("link", { name: "1페이지" });
    expect(first.getAttribute("href")).not.toContain("page=");
  });

  it("7페이지를 넘으면 생략 기호를 렌더링한다", () => {
    const { container } = render(
      <Pagination current={{ page: 5 }} page={5} totalPages={10} />,
    );

    expect(container.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(
      2,
    );
  });

  it("모바일용 현재/전체 텍스트에 스크린리더 이름을 둔다", () => {
    render(<Pagination current={{}} page={2} totalPages={5} />);

    expect(screen.getByText("5페이지 중 2페이지")).toBeInTheDocument();
  });

  it("범위를 벗어난 page여도 크래시하지 않는다", () => {
    expect(() =>
      render(<Pagination current={{}} page={99} totalPages={5} />),
    ).not.toThrow();
  });

  it("검색어를 모든 링크에 유지한다", () => {
    render(<Pagination current={{ q: "캐시" }} page={2} totalPages={3} />);

    const q = encodeURIComponent("캐시");
    expect(screen.getByRole("link", { name: "이전 페이지" })).toHaveAttribute(
      "href",
      `/blog?q=${q}`,
    );
    expect(screen.getByRole("link", { name: "3페이지" })).toHaveAttribute(
      "href",
      `/blog?q=${q}&page=3`,
    );
  });
});
