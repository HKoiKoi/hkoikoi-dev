import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Comments } from "./comments";

const mocks = vi.hoisted(() => ({
  theme: { resolvedTheme: "light" as string | undefined },
  giscus: {
    repo: "owner/repo",
    repoId: "R_repo",
    category: "Comments",
    categoryId: "DIC_category",
  },
}));

vi.mock("next-themes", () => ({
  useTheme: () => mocks.theme,
}));

vi.mock("@/lib/site-config", () => ({
  siteConfig: {
    get giscus() {
      return mocks.giscus;
    },
  },
}));

type ObserverCallback = (entries: { isIntersecting: boolean }[]) => void;

let observerCallback: ObserverCallback | null = null;
const disconnect = vi.fn();

class FakeIntersectionObserver {
  constructor(callback: ObserverCallback) {
    observerCallback = callback;
  }
  observe = vi.fn();
  disconnect = disconnect;
}

function intersect() {
  act(() => observerCallback?.([{ isIntersecting: true }]));
}

function findScript() {
  return document.querySelector<HTMLScriptElement>(
    'script[src="https://giscus.app/client.js"]',
  );
}

describe("Comments", () => {
  beforeEach(() => {
    mocks.theme.resolvedTheme = "light";
    mocks.giscus.repo = "owner/repo";
    mocks.giscus.repoId = "R_repo";
    mocks.giscus.category = "Comments";
    mocks.giscus.categoryId = "DIC_category";
    observerCallback = null;
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    disconnect.mockReset();
  });

  it.each(["repo", "repoId", "category", "categoryId"] as const)(
    "%s 설정이 비어 있으면 아무것도 렌더링하지 않는다",
    (key) => {
      mocks.giscus[key] = "";

      const { container } = render(<Comments postId="post-1" />);

      expect(container).toBeEmptyDOMElement();
    },
  );

  it("화면에 들어오기 전에는 giscus 스크립트를 넣지 않는다", () => {
    render(<Comments postId="post-1" />);

    expect(screen.getByRole("heading", { name: "댓글" })).toBeInTheDocument();
    expect(findScript()).toBeNull();
  });

  it("화면에 들어오면 글 id로 매핑한 스크립트를 한 번 넣고 관찰을 멈춘다", () => {
    render(<Comments postId="post-1" />);

    intersect();

    const script = findScript();
    expect(script).not.toBeNull();
    expect(script?.dataset).toMatchObject({
      repo: "owner/repo",
      repoId: "R_repo",
      category: "Comments",
      categoryId: "DIC_category",
      mapping: "specific",
      term: "post-1",
      strict: "0",
      theme: "light",
      loading: "lazy",
    });
    expect(script?.crossOrigin).toBe("anonymous");
    expect(document.querySelectorAll("script[data-term]")).toHaveLength(1);
    expect(disconnect).toHaveBeenCalled();
  });

  it("다크 테마면 data-theme을 dark로 넣는다", () => {
    mocks.theme.resolvedTheme = "dark";
    render(<Comments postId="post-1" />);

    intersect();

    expect(findScript()?.dataset.theme).toBe("dark");
  });

  it("테마가 정해지기 전에는 화면에 들어와도 불러오지 않는다", () => {
    mocks.theme.resolvedTheme = undefined;
    const { rerender } = render(<Comments postId="post-1" />);

    intersect();
    expect(findScript()).toBeNull();

    mocks.theme.resolvedTheme = "dark";
    rerender(<Comments postId="post-1" />);
    expect(findScript()?.dataset.theme).toBe("dark");
  });

  it("IntersectionObserver가 없으면 바로 불러온다", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    render(<Comments postId="post-1" />);

    expect(findScript()).not.toBeNull();
  });

  it("테마가 바뀌면 이미 뜬 iframe에 giscus.app으로만 메시지를 보낸다", () => {
    const { container, rerender } = render(<Comments postId="post-1" />);
    intersect();

    const iframe = document.createElement("iframe");
    iframe.className = "giscus-frame";
    container.querySelector("div")?.appendChild(iframe);
    const postMessage = vi.spyOn(iframe.contentWindow!, "postMessage");
    postMessage.mockClear();

    mocks.theme.resolvedTheme = "dark";
    rerender(<Comments postId="post-1" />);

    expect(postMessage).toHaveBeenCalledWith(
      { giscus: { setConfig: { theme: "dark" } } },
      "https://giscus.app",
    );
    // 테마만 바뀐 것이라 스크립트를 다시 넣지 않는다.
    expect(document.querySelectorAll("script[data-term]")).toHaveLength(1);
  });

  it("iframe이 아직 없을 때 테마가 바뀌어도 오류를 내지 않는다", () => {
    const { rerender } = render(<Comments postId="post-1" />);

    mocks.theme.resolvedTheme = "dark";

    expect(() => rerender(<Comments postId="post-1" />)).not.toThrow();
  });

  it("스크립트 로드에 실패하면 안내 문구를 보여 준다", () => {
    render(<Comments postId="post-1" />);
    intersect();

    expect(screen.queryByRole("status")).toBeNull();
    act(() => {
      findScript()?.dispatchEvent(new Event("error"));
    });

    expect(screen.getByRole("status")).toHaveTextContent(
      "댓글을 불러오지 못했습니다",
    );
    expect(screen.getByRole("heading", { name: "댓글" })).toBeInTheDocument();
  });

  it("제한 시간 안에 iframe이 생기지 않으면 안내 문구를 보여 준다", () => {
    vi.useFakeTimers();
    render(<Comments postId="post-1" />);
    intersect();

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("제한 시간 안에 iframe이 생기면 안내 문구를 보여 주지 않는다", () => {
    vi.useFakeTimers();
    const { container } = render(<Comments postId="post-1" />);
    intersect();
    const iframe = document.createElement("iframe");
    iframe.className = "giscus-frame";
    container.querySelector("div")?.appendChild(iframe);

    act(() => {
      vi.advanceTimersByTime(15_000);
    });

    expect(screen.queryByRole("status")).toBeNull();
  });

  it("언마운트하면 넣은 스크립트를 정리한다", () => {
    const { unmount } = render(<Comments postId="post-1" />);
    intersect();
    expect(findScript()).not.toBeNull();

    unmount();

    expect(findScript()).toBeNull();
  });

  it("글이 바뀌면 이전 스크립트를 걷어내고 새 글 id로 다시 불러온다", () => {
    const { rerender } = render(<Comments postId="post-1" />);
    intersect();

    rerender(<Comments postId="post-2" />);
    intersect();

    const scripts =
      document.querySelectorAll<HTMLScriptElement>("script[data-term]");
    expect(scripts).toHaveLength(1);
    expect(scripts[0].dataset.term).toBe("post-2");
  });
});
