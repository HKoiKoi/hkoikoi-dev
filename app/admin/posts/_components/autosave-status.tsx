import { cn } from "@/lib/utils";

import type { AutosaveStatus } from "./use-autosave";

interface AutosaveStatusProps {
  status: AutosaveStatus;
  savedAt: Date | null;
}

const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function getMessage(status: AutosaveStatus, savedAt: Date | null): string {
  switch (status) {
    case "saving":
      return "저장 중…";
    case "saved":
      return savedAt
        ? `자동 저장됨 ${timeFormatter.format(savedAt)}`
        : "자동 저장됨";
    case "local":
      return "로컬에 보관됨";
    case "error":
      return "저장 실패";
    case "conflict":
      return "다른 곳에서 수정되어 자동 저장을 멈췄습니다";
    default:
      return "";
  }
}

// 자동 저장 상태 표시 (순수 표시 컴포넌트)
export function AutosaveStatus({ status, savedAt }: AutosaveStatusProps) {
  const isAlert = status === "error" || status === "conflict";

  return (
    <p
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? undefined : "polite"}
      className={cn(
        "text-sm",
        isAlert ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {getMessage(status, savedAt)}
    </p>
  );
}
