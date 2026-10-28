import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ImageUploadButton } from "./image-upload-button";

describe("ImageUploadButton", () => {
  it("파일을 선택하면 onFiles에 목록을 전달한다", () => {
    const onFiles = vi.fn();
    render(<ImageUploadButton onFiles={onFiles} />);

    const file = new File(["x"], "a.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("image-upload-input"), {
      target: { files: [file] },
    });

    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("disabled면 버튼이 비활성화된다", () => {
    render(<ImageUploadButton onFiles={vi.fn()} disabled />);
    expect(screen.getByRole("button", { name: "이미지 추가" })).toBeDisabled();
  });
});
