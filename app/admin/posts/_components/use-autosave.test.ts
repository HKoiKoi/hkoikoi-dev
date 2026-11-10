import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { readDraft, type PostDraft } from "@/lib/editor/draft-storage";

import { useAutosave, type AutosaveServerResult } from "./use-autosave";

const ID = "post-1";

function makeDraft(content: string): PostDraft {
  return {
    title: "제목",
    slug: "slug",
    category: "개발",
    tags: "",
    excerpt: "소개",
    content,
    thumbnailUrl: "",
    savedAt: 1,
    baseUpdatedAt: "2026-01-01T00:00:00Z",
  };
}

type Setup = {
  content?: { current: string };
  save?: (s: PostDraft) => Promise<AutosaveServerResult>;
  blocked?: boolean;
  enabled?: boolean;
  canSaveToServer?: boolean;
  storageId?: string | null;
};

function setup(initial: Setup = {}) {
  const content = initial.content ?? { current: "a" };
  const save = vi.fn(
    initial.save ??
      (async (): Promise<AutosaveServerResult> => ({
        ok: true,
        updatedAt: "2026-01-02T00:00:00Z",
      })),
  );
  const hook = renderHook(
    (props: { blocked: boolean }) =>
      useAutosave({
        getSnapshot: () => makeDraft(content.current),
        enabled: initial.enabled ?? true,
        blocked: props.blocked,
        canSaveToServer: initial.canSaveToServer ?? true,
        saveToServer: save,
        storageId: initial.storageId === undefined ? ID : initial.storageId,
      }),
    { initialProps: { blocked: initial.blocked ?? false } },
  );
  return { ...hook, content, save };
}

const advance = (ms: number) =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useAutosave", () => {
  it("입력이 멈춘 2초 뒤에 한 번 저장한다", async () => {
    const { result, save } = setup();

    act(() => result.current.notifyChange());
    await advance(1999);
    expect(save).not.toHaveBeenCalled();

    await advance(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saved");
    expect(result.current.savedAt).toBeInstanceOf(Date);
  });

  it("연속 입력은 마지막 입력 기준으로 합쳐 한 번만 저장한다", async () => {
    const { result, save, content } = setup();

    act(() => result.current.notifyChange());
    await advance(1500);
    content.current = "ab";
    act(() => result.current.notifyChange());
    await advance(1500);
    expect(save).not.toHaveBeenCalled();

    await advance(500);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save.mock.calls[0][0].content).toBe("ab");
  });

  it("저장 중에 들어온 변경은 끝난 뒤 마지막 값으로 한 번만 다시 저장한다", async () => {
    let release: (r: AutosaveServerResult) => void = () => {};
    const { result, save, content } = setup({
      save: () => new Promise((resolve) => (release = resolve)),
    });

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("saving");

    content.current = "b";
    act(() => result.current.notifyChange());
    content.current = "bc";
    act(() => result.current.notifyChange());
    await advance(5000);
    expect(save).toHaveBeenCalledTimes(1);

    await act(async () => release({ ok: true, updatedAt: "t1" }));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save.mock.calls[1][0].content).toBe("bc");

    await act(async () => release({ ok: true, updatedAt: "t2" }));
    await advance(5000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("saved");
  });

  it("blocked 동안 보류하고 풀리면 마지막 변경을 저장한다", async () => {
    const { result, save, rerender } = setup({ blocked: true });

    act(() => result.current.notifyChange());
    await advance(10_000);
    expect(save).not.toHaveBeenCalled();
    expect(readDraft(ID)).toBeNull();

    rerender({ blocked: false });
    await advance(2000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("타이머가 돈 뒤 blocked가 되면 저장하지 않는다", async () => {
    const { result, save, rerender } = setup();

    act(() => result.current.notifyChange());
    await advance(1000);
    rerender({ blocked: true });
    await advance(5000);
    expect(save).not.toHaveBeenCalled();
  });

  it("서버 실패는 error로 두고 로컬 사본을 남기며 다음 입력에서 재시도한다", async () => {
    let fail = true;
    const { result, save, content } = setup({
      save: async () =>
        fail
          ? { ok: false, reason: "failed", message: "x" }
          : { ok: true, updatedAt: "t" },
    });

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(result.current.status).toBe("error");
    expect(readDraft(ID)?.content).toBe("a");

    await advance(10_000);
    expect(save).toHaveBeenCalledTimes(1);

    fail = false;
    content.current = "ab";
    act(() => result.current.notifyChange());
    await advance(2000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe("saved");
  });

  it("saveToServer가 throw해도 error로 처리한다", async () => {
    const { result } = setup({
      save: async () => {
        throw new Error("network");
      },
    });

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(result.current.status).toBe("error");
  });

  it("conflict면 서버 재시도를 멈추고 로컬 사본만 갱신한다", async () => {
    const { result, save, content } = setup({
      save: async () => ({ ok: false, reason: "conflict", message: "x" }),
    });

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(result.current.status).toBe("conflict");
    expect(save).toHaveBeenCalledTimes(1);

    content.current = "newer";
    act(() => result.current.notifyChange());
    await advance(2000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("conflict");
    expect(readDraft(ID)?.content).toBe("newer");
  });

  it("서버 성공이면 로컬 사본을 지운다", async () => {
    const { result } = setup();

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(result.current.status).toBe("saved");
    expect(readDraft(ID)).toBeNull();
  });

  it("canSaveToServer가 false면 서버를 부르지 않고 local 상태로 둔다", async () => {
    const { result, save } = setup({
      canSaveToServer: false,
      storageId: null,
    });

    act(() => result.current.notifyChange());
    await advance(2000);
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe("local");
    expect(readDraft(null)?.content).toBe("a");
  });

  it("enabled가 false면 아무것도 하지 않는다", async () => {
    const { result, save } = setup({ enabled: false });

    act(() => result.current.notifyChange());
    await advance(5000);
    expect(save).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("flush는 대기 중인 변경을 즉시 저장한다", async () => {
    const { result, save } = setup();

    act(() => result.current.notifyChange());
    await act(async () => {
      await result.current.flush();
    });
    expect(save).toHaveBeenCalledTimes(1);

    await advance(5000);
    expect(save).toHaveBeenCalledTimes(1);
  });
});
