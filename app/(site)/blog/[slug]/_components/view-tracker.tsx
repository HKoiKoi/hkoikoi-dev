"use client";

import { useEffect, useRef } from "react";

// useEffect는 마운트 뒤에만 실행되므로 링크 프리페치·프리렌더로는 조회수가 오르지 않는다.
export function ViewTracker({ postId }: { postId: string }) {
  const sentRef = useRef(false);

  useEffect(() => {
    // StrictMode의 effect 이중 실행에도 한 번만 보낸다.
    if (sentRef.current) return;
    sentRef.current = true;

    // 집계 실패가 화면에 영향을 주지 않도록 오류는 삼킨다.
    fetch(`/api/posts/${postId}/view`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [postId]);

  return null;
}
