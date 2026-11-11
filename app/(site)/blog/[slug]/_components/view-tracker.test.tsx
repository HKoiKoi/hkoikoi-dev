import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ViewTracker } from "./view-tracker";

describe("ViewTracker", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("마운트하면 조회수 증가 API를 POST로 한 번 호출한다", () => {
    render(<ViewTracker postId="post-1" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/posts/post-1/view", {
      method: "POST",
      keepalive: true,
    });
  });

  it("리렌더해도 추가 호출하지 않는다", () => {
    const { rerender } = render(<ViewTracker postId="post-1" />);
    rerender(<ViewTracker postId="post-1" />);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetch가 실패해도 오류를 내지 않는다", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    expect(() => render(<ViewTracker postId="post-1" />)).not.toThrow();
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
