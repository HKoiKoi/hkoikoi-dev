import { Button } from "@/components/ui/button";

interface RestoreBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

// 저장하지 않은 로컬 백업이 있을 때 보여주는 복원 안내 (표시 전용)
export function RestoreBanner({ onRestore, onDiscard }: RestoreBannerProps) {
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted px-4 py-3 text-sm text-foreground"
    >
      <p>저장하지 않은 변경이 있습니다.</p>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={onRestore}>
          복원
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onDiscard}>
          버리기
        </Button>
      </div>
    </div>
  );
}
