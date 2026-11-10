"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { deleteOrphans } from "@/app/admin/storage/actions";
import { formatDate } from "@/lib/format-date";
import type { StorageObjectInfo } from "@/lib/storage/find-orphans";

// deleteOrphans가 한 번에 받는 경로 상한과 같다.
const MAX_SELECT = 100;

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function OrphanList({
  candidates,
  total,
}: {
  candidates: StorageObjectInfo[];
  total: number;
}) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  // 삭제 뒤 목록이 갱신돼 사라진 경로는 선택에서 자연스럽게 빠진다.
  const selectedPaths = candidates
    .filter((c) => selected.has(c.path))
    .map((c) => c.path);
  const selectable = candidates.slice(0, MAX_SELECT);
  const allSelected =
    selectable.length > 0 && selectedPaths.length === selectable.length;

  function toggle(path: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) {
      if (next.size >= MAX_SELECT) return;
      next.add(path);
    } else {
      next.delete(path);
    }
    setSelected(next);
  }

  function toggleAll(checked: boolean) {
    setSelected(new Set(checked ? selectable.map((c) => c.path) : []));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;
    setOpen(nextOpen);
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteOrphans(selectedPaths);
      setSummary({ ok: result.ok, text: result.message });
      setSelected(new Set());
      setOpen(false);
    });
  }

  return (
    <div className="grid gap-4">
      {summary && (
        <p
          role={summary.ok ? "status" : "alert"}
          className={
            summary.ok
              ? "rounded-xl border p-4 text-sm"
              : "rounded-xl border border-destructive/50 p-4 text-sm text-destructive"
          }
        >
          {summary.text}
        </p>
      )}

      {candidates.length === 0 ? (
        <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
          삭제할 수 있는 미사용 이미지가 없습니다. (버킷 전체 {total}개)
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              후보 {candidates.length}개 / 버킷 전체 {total}개 · 선택{" "}
              {selectedPaths.length}개
              {candidates.length > MAX_SELECT &&
                ` (한 번에 최대 ${MAX_SELECT}개)`}
            </p>
            <Dialog open={open} onOpenChange={handleOpenChange}>
              <DialogTrigger
                render={<Button variant="destructive" size="sm" />}
                disabled={selectedPaths.length === 0}
              >
                선택 삭제
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>이미지를 삭제할까요?</DialogTitle>
                  <DialogDescription>
                    선택한 이미지 {selectedPaths.length}개를 삭제하면 되돌릴 수
                    없습니다. 삭제 직전에 참조 여부를 다시 확인해, 그 사이 글에
                    쓰인 이미지는 건너뜁니다.
                  </DialogDescription>
                </DialogHeader>
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
          </div>

          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-xl text-left text-sm">
              <caption className="sr-only">미사용 이미지 후보 목록</caption>
              <thead className="border-b bg-muted/50 text-muted-foreground">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <Checkbox
                      aria-label="전체 선택"
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    경로
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    크기
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    업로드일
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {candidates.map((c) => (
                  <tr key={c.path}>
                    <td className="px-4 py-3">
                      <Checkbox
                        aria-label={`${c.path} 선택`}
                        checked={selected.has(c.path)}
                        onCheckedChange={(checked) => toggle(c.path, checked)}
                      />
                    </td>
                    <th
                      scope="row"
                      className="px-4 py-3 font-mono text-xs font-normal break-all"
                    >
                      {c.path}
                    </th>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatKB(c.size)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
