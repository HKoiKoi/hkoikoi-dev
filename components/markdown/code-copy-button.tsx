"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";

const RESET_DELAY_MS = 2000;

// 같은 wrapper 안의 <pre>에서 highlight 후 렌더된 순수 텍스트를 클릭 시점에 읽는다.
// 텍스트를 props로 넘기지 않아 서버 → 클라이언트 직렬화 데이터가 없다.
export function CodeCopyButton() {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const pre = event.currentTarget.parentElement?.querySelector("pre");
    const text = pre?.textContent?.replace(/\n+$/, "");
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 권한 거부·비보안 컨텍스트 등은 조용히 무시한다.
      return;
    }
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), RESET_DELAY_MS);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        aria-label={copied ? "코드 복사됨" : "코드 복사"}
        onClick={handleClick}
        className="not-prose absolute top-2 right-2 text-muted-foreground"
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
        {copied ? "복사됨" : "복사"}
      </Button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "코드를 클립보드에 복사했습니다" : ""}
      </span>
    </>
  );
}
