import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RestoreBanner } from "./restore-banner";

describe("RestoreBanner", () => {
  it("안내 문구를 status로 보여준다", () => {
    render(<RestoreBanner onRestore={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "저장하지 않은 변경이 있습니다.",
    );
  });

  it("복원 버튼을 누르면 onRestore를 호출한다", async () => {
    const onRestore = vi.fn();
    const onDiscard = vi.fn();
    render(<RestoreBanner onRestore={onRestore} onDiscard={onDiscard} />);

    await userEvent.click(screen.getByRole("button", { name: "복원" }));

    expect(onRestore).toHaveBeenCalledTimes(1);
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it("버리기 버튼을 누르면 onDiscard를 호출한다", async () => {
    const onRestore = vi.fn();
    const onDiscard = vi.fn();
    render(<RestoreBanner onRestore={onRestore} onDiscard={onDiscard} />);

    await userEvent.click(screen.getByRole("button", { name: "버리기" }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
    expect(onRestore).not.toHaveBeenCalled();
  });
});
