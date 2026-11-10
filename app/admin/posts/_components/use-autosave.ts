"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clearDraft,
  writeDraft,
  type PostDraft,
} from "@/lib/editor/draft-storage";

export type AutosaveStatus =
  "idle" | "saving" | "saved" | "local" | "error" | "conflict";

export type AutosaveServerResult =
  | { ok: true; updatedAt: string }
  | { ok: false; reason: string; message: string };

type UseAutosaveOptions = {
  /** 현재 폼 값을 스냅샷으로 읽는다. 읽을 수 없으면 null */
  getSnapshot: () => PostDraft | null;
  enabled: boolean;
  /** true인 동안(이미지 업로드 중 등) 저장을 보류하고, false가 되면 마지막 변경을 다시 예약한다. */
  blocked: boolean;
  /** 입력이 멈춘 뒤 저장하기까지 기다리는 시간(ms) */
  delay?: number;
  /** false면 로컬 백업만 한다(새 글, 발행된 글). */
  canSaveToServer: boolean;
  saveToServer?: (snapshot: PostDraft) => Promise<AutosaveServerResult>;
  /** 로컬 백업 키에 쓰는 글 id. 새 글이면 null */
  storageId: string | null;
};

const DEFAULT_DELAY = 2000;
const UNKNOWN_FAILURE: AutosaveServerResult = {
  ok: false,
  reason: "failed",
  message: "자동 저장하지 못했습니다.",
};

/**
 * 편집기 자동 저장. 입력이 멈춘 뒤 로컬에 먼저 백업하고, 가능하면 서버에도 저장한다.
 * 저장 진행 중에 들어온 변경은 끝난 뒤 마지막 스냅샷으로 한 번만 다시 저장한다.
 * 서버 실패는 로컬 사본을 남기고 다음 변경 때 재시도하며, 충돌이면 서버 재시도를 멈춘다.
 */
export function useAutosave(options: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // 타이머 콜백이 항상 최신 옵션을 읽도록 렌더 뒤 effect에서 갱신한다.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  // 저장 진행 중에 변경이 들어왔는지
  const pendingRef = useRef(false);
  // 아직 저장하지 못한 변경이 있는지
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const persist = useCallback(async (): Promise<void> => {
    const opts = optionsRef.current;
    if (!opts.enabled || opts.blocked) return;

    const first = opts.getSnapshot();
    if (!first) {
      dirtyRef.current = false;
      return;
    }
    dirtyRef.current = false;
    writeDraft(opts.storageId, first);

    const save = opts.saveToServer;
    if (!opts.canSaveToServer || !save) {
      setStatus("local");
      return;
    }
    // 충돌 뒤에는 서버를 건드리지 않고 로컬 사본만 갱신한다.
    if (conflictRef.current) return;

    const task = (async () => {
      let snapshot = first;
      for (;;) {
        pendingRef.current = false;
        setStatus("saving");

        let result: AutosaveServerResult;
        try {
          result = await save(snapshot);
        } catch (error) {
          console.error("[useAutosave]", error);
          result = UNKNOWN_FAILURE;
        }

        if (!result.ok) {
          dirtyRef.current = true;
          if (result.reason === "conflict") {
            conflictRef.current = true;
            setStatus("conflict");
          } else {
            setStatus("error");
          }
          return;
        }

        if (pendingRef.current) {
          const next = optionsRef.current.getSnapshot();
          if (next) {
            snapshot = next;
            dirtyRef.current = false;
            writeDraft(optionsRef.current.storageId, next);
            continue;
          }
        }

        clearDraft(optionsRef.current.storageId);
        setSavedAt(new Date());
        setStatus("saved");
        return;
      }
    })().finally(() => {
      inFlightRef.current = null;
    });

    inFlightRef.current = task;
    return task;
  }, []);

  const schedule = useCallback(() => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persist();
    }, optionsRef.current.delay ?? DEFAULT_DELAY);
  }, [clearTimer, persist]);

  const notifyChange = useCallback(() => {
    const opts = optionsRef.current;
    if (!opts.enabled) return;
    dirtyRef.current = true;
    // 저장 중이면 끝난 뒤 마지막 스냅샷으로 한 번 더 저장하므로 타이머를 따로 걸지 않는다.
    if (inFlightRef.current) {
      pendingRef.current = true;
      return;
    }
    if (opts.blocked) return;
    schedule();
  }, [schedule]);

  const flush = useCallback(async () => {
    clearTimer();
    if (dirtyRef.current) await persist();
    if (inFlightRef.current) await inFlightRef.current;
  }, [clearTimer, persist]);

  // 보류(blocked)나 비활성 동안 타이머를 멈추고, 풀리면 마지막 변경을 다시 예약한다.
  const { blocked, enabled } = options;
  useEffect(() => {
    if (blocked || !enabled) {
      clearTimer();
      return;
    }
    if (dirtyRef.current && !inFlightRef.current) schedule();
  }, [blocked, enabled, clearTimer, schedule]);

  useEffect(() => clearTimer, [clearTimer]);

  return { status, savedAt, notifyChange, flush };
}
