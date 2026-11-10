import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchForm } from "./search-form";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("SearchResetLink", () => {
  it("누르면 타이핑만 해 둔 검색창도 비운다", () => {
    render(<SearchForm current={{}} />);
    const input = screen.getByLabelText("블로그 검색");
    fireEvent.change(input, { target: { value: "캐시" } });
    expect(input).toHaveValue("캐시");

    fireEvent.click(screen.getByRole("link", { name: "초기화" }));

    expect(input).toHaveValue("");
  });

  it("검색 중이어도 검색창을 비운다", () => {
    render(<SearchForm current={{ q: "캐시" }} total={1} />);
    const input = screen.getByLabelText("블로그 검색");

    fireEvent.click(screen.getByRole("link", { name: "초기화" }));

    expect(input).toHaveValue("");
  });
});
