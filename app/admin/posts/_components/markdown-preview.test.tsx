import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarkdownPreview } from "./markdown-preview";

// shadow root는 마운트 후 effect에서 만들어지므로 생길 때까지 기다린다.
async function renderPreview(content: string) {
  const { container } = render(<MarkdownPreview content={content} />);
  const host = container.firstElementChild as HTMLElement;
  await waitFor(() => expect(host.shadowRoot?.firstElementChild).toBeTruthy());
  return host.shadowRoot as ShadowRoot;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MarkdownPreview", () => {
  it("본문을 shadow root 안에 렌더링한다", async () => {
    const root = await renderPreview("# 제목");
    await waitFor(() =>
      expect(root.querySelector("h1")?.textContent).toBe("제목"),
    );
  });

  it("본문이 호스트 바깥 light DOM으로 새지 않는다", async () => {
    const { container } = render(<MarkdownPreview content="# 제목" />);
    const host = container.firstElementChild as HTMLElement;
    await waitFor(() =>
      expect(host.shadowRoot?.querySelector("h1")).toBeTruthy(),
    );
    expect(container.querySelector("h1")).toBeNull();
  });

  it("본문이 비어 있으면 안내 문구를 보여준다", async () => {
    const root = await renderPreview("");
    expect(root.textContent).toContain("본문을 입력하면 여기에 표시됩니다");
  });

  it("공백만 있어도 안내 문구를 보여준다", async () => {
    const root = await renderPreview("  \n ");
    expect(root.textContent).toContain("본문을 입력하면 여기에 표시됩니다");
  });

  it.each(["$", "$$", "$$\n\\frac{", "$\\frac{$"])(
    "미완성 수식 %j 입력에도 예외 없이 렌더링한다",
    async (content) => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const root = await renderPreview(content);
      expect(root.textContent).not.toContain("미리보기를 표시할 수 없습니다");
    },
  );

  it("본문 <style>이 문서(light DOM)에 삽입되지 않는다", async () => {
    await renderPreview("<style>body{background:red}</style>\n\n본문");
    expect(
      Array.from(document.querySelectorAll("style")).some((el) =>
        el.textContent?.includes("background:red"),
      ),
    ).toBe(false);
  });
});
