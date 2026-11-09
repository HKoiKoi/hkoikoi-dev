import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PostPager } from "./post-pager";

const older = { slug: "old-post", title: "오래된 글" };
const newer = { slug: "new-post", title: "최근 글" };

describe("PostPager", () => {
  it("이전·다음이 모두 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<PostPager prev={null} next={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("nav에 접근성 레이블을 붙인다", () => {
    render(<PostPager prev={older} next={newer} />);

    expect(
      screen.getByRole("navigation", { name: "이전·다음 글" }),
    ).toBeInTheDocument();
  });

  it("양쪽 링크를 레이블·제목과 함께 보여 준다", () => {
    render(<PostPager prev={older} next={newer} />);

    const prevLink = screen.getByRole("link", { name: /이전 글/ });
    const nextLink = screen.getByRole("link", { name: /다음 글/ });
    expect(prevLink).toHaveTextContent("오래된 글");
    expect(prevLink).toHaveAttribute("href", "/blog/old-post");
    expect(nextLink).toHaveTextContent("최근 글");
    expect(nextLink).toHaveAttribute("href", "/blog/new-post");
  });

  it("이전 글만 있으면 이전 링크만 표시한다", () => {
    render(<PostPager prev={older} next={null} />);

    expect(screen.getByRole("link", { name: /이전 글/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /다음 글/ })).toBeNull();
  });

  it("다음 글만 있으면 다음 링크만 오른쪽 열에 둔다", () => {
    render(<PostPager prev={null} next={newer} />);

    expect(screen.queryByRole("link", { name: /이전 글/ })).toBeNull();
    expect(screen.getByRole("link", { name: /다음 글/ })).toHaveClass(
      "sm:col-start-2",
    );
  });

  it("한글 슬러그는 인코딩한 href로 연결한다", () => {
    render(<PostPager prev={{ slug: "한글 글", title: "한글" }} next={null} />);

    expect(screen.getByRole("link", { name: /이전 글/ })).toHaveAttribute(
      "href",
      `/blog/${encodeURIComponent("한글 글")}`,
    );
  });
});
