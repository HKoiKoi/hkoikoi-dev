"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

// 이 높이(px) 이상 스크롤하면 버튼을 보여준다.
const SHOW_AFTER = 400;

// 화면 오른쪽 아래에 고정되는 맨 위로 이동 버튼
export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      aria-label="맨 위로"
      className="fixed right-4 bottom-4 z-40 rounded-full bg-background shadow-md md:right-6 md:bottom-6"
      onClick={() => {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      }}
    >
      <ArrowUpIcon aria-hidden="true" />
    </Button>
  );
}
