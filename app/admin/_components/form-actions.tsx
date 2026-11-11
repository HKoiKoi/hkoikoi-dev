import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

// 폼 하단: 전체 오류 메시지(role=alert), 저장 버튼, 취소 링크
export function FormActions({
  pending,
  message,
  cancelHref,
}: {
  pending: boolean;
  /** 제출 실패 시 서버가 돌려준 전체 메시지(필드 오류와 별개) */
  message?: string;
  cancelHref: string;
}) {
  return (
    <div className="grid gap-3">
      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
        <Link
          href={cancelHref}
          className={buttonVariants({ variant: "outline" })}
        >
          취소
        </Link>
      </div>
    </div>
  );
}
