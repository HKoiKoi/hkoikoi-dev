"use client";

import { useState } from "react";
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

export function DeletePostDialog({ postTitle }: { postTitle: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>취소</DialogClose>
          {/* TODO: Task 012에서 삭제 Server Action을 연결한다. 지금은 Dialog만 닫는다. */}
          <Button variant="destructive" onClick={() => setOpen(false)}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
