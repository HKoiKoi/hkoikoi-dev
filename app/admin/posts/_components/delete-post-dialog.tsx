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
import { deletePost } from "@/app/admin/posts/actions";

interface DeletePostDialogProps {
  postId: string;
  postTitle: string;
}

export function DeletePostDialog({ postId, postTitle }: DeletePostDialogProps) {
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
      const result = await deletePost(postId);
      if (result.ok) {
        setOpen(false);
      } else {
        setError(result.message ?? "글을 삭제하지 못했습니다.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="destructive" size="sm" />}
        aria-label={`${postTitle} 삭제`}
      >
        삭제
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>글을 삭제할까요?</DialogTitle>
          <DialogDescription>
            &lsquo;{postTitle}&rsquo; 글을 삭제하면 되돌릴 수 없습니다.
          </DialogDescription>
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
