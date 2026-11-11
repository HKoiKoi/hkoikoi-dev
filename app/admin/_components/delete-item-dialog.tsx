"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DeleteItemDialogProps {
  // 트리거 버튼의 aria-label(`<itemName> 삭제`)에 쓰는 항목 이름
  itemName: string;
  title: string;
  description: string;
  onDelete: () => Promise<{ ok: boolean; message?: string }>;
}

// 글·이력·프로젝트·논문 등 관리자 삭제 확인 다이얼로그. 실제 삭제는 onDelete(Server Action)가 한다.
export function DeleteItemDialog({
  itemName,
  title,
  description,
  onDelete,
}: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 삭제 중에는 오버레이 클릭/Esc/닫기 버튼으로 닫히지 않게 막고, 닫힐 때 오류를 초기화한다.
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;
    setOpen(nextOpen);
    if (!nextOpen) setError(null);
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await onDelete();
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.message ?? "삭제하지 못했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" />}
        aria-label={`${itemName} 삭제`}
      >
        삭제
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={isPending} />}
          >
            취소
          </DialogClose>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={handleDelete}
          >
            {isPending ? "삭제 중..." : "삭제"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
