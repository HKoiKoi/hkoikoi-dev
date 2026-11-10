import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AutosaveStatus } from "./autosave-status";

describe("AutosaveStatus", () => {
  it("idle이면 내용이 비어 있다", () => {
    render(<AutosaveStatus status="idle" savedAt={null} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("saving 문구를 status로 보여준다", () => {
    render(<AutosaveStatus status="saving" savedAt={null} />);
    const el = screen.getByRole("status");
    expect(el).toHaveTextContent("저장 중…");
    expect(el).toHaveAttribute("aria-live", "polite");
  });

  it("saved는 시각을 HH:MM으로 보여준다", () => {
    render(
      <AutosaveStatus status="saved" savedAt={new Date(2026, 0, 1, 9, 5)} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("자동 저장됨 09:05");
  });

  it("saved인데 savedAt이 null이면 시각 없이 보여준다", () => {
    render(<AutosaveStatus status="saved" savedAt={null} />);
    expect(screen.getByRole("status").textContent).toBe("자동 저장됨");
  });

  it("local 문구를 보여준다", () => {
    render(<AutosaveStatus status="local" savedAt={null} />);
    expect(screen.getByRole("status")).toHaveTextContent("로컬에 보관됨");
  });

  it("error는 alert로 보여준다", () => {
    render(<AutosaveStatus status="error" savedAt={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent("저장 실패");
  });

  it("conflict는 alert로 보여준다", () => {
    render(<AutosaveStatus status="conflict" savedAt={null} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "다른 곳에서 수정되어 자동 저장을 멈췄습니다",
    );
  });
});
