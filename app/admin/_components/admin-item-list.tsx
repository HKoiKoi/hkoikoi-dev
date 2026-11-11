"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { DeleteItemDialog } from "@/app/admin/_components/delete-item-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import type { MoveDirection } from "@/lib/admin/reorder";

type AdminListItem = {
  id: string;
  title: string;
  /** 제목 아래 보조 정보(기간·연도 등) */
  meta?: string;
  visible: boolean;
  /** 제목 옆 배지(예: 대표) */
  badges?: string[];
};

type ActionResult = { ok: boolean; message?: string };

interface AdminItemListProps {
  items: AdminListItem[];
  /** 표 설명(스크린리더용) */
  caption: string;
  emptyMessage: string;
  /** 수정 화면 경로의 앞부분. 항목 수정 링크는 `<editBasePath>/<id>/edit`이다(함수는 서버→클라이언트로 넘길 수 없다). */
  editBasePath: string;
  /** 항목 종류 이름. 삭제 확인 문구에 쓴다(예: 항목, 프로젝트). */
  noun: string;
  toggleAction: (id: string, visible: boolean) => Promise<ActionResult>;
  deleteAction: (id: string) => Promise<ActionResult>;
  /** 없으면 이동 버튼을 그리지 않는다(논문은 연도순이라 이동 없음). */
  moveAction?: (id: string, direction: MoveDirection) => Promise<ActionResult>;
}

// 이력·프로젝트·논문이 공유하는 관리자 목록. 순서 이동·공개 토글은 Server Action을 호출하고,
// 성공하면 액션의 revalidatePath로 목록이 새로 그려진다.
export function AdminItemList({
  items,
  caption,
  emptyMessage,
  editBasePath,
  noun,
  toggleAction,
  deleteAction,
  moveAction,
}: AdminItemListProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<ActionResult>, fallback: string) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.message ?? fallback);
    });
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-3xl text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                제목
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                상태
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => (
              <tr key={item.id}>
                <th scope="row" className="px-4 py-3 font-medium">
                  <span className="flex flex-wrap items-center gap-2">
                    {item.title}
                    {item.badges?.map((badge) => (
                      <Badge key={badge} variant="secondary">
                        {badge}
                      </Badge>
                    ))}
                  </span>
                  {item.meta && (
                    <span className="block text-xs font-normal text-muted-foreground">
                      {item.meta}
                    </span>
                  )}
                </th>
                <td className="px-4 py-3">
                  <Badge variant={item.visible ? "default" : "outline"}>
                    {item.visible ? "공개" : "숨김"}
                  </Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex flex-nowrap items-center justify-end gap-2">
                    {moveAction && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${item.title} 위로 이동`}
                          disabled={isPending || index === 0}
                          onClick={() =>
                            run(
                              () => moveAction(item.id, "up"),
                              "순서를 바꾸지 못했습니다.",
                            )
                          }
                        >
                          <ChevronUpIcon aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          aria-label={`${item.title} 아래로 이동`}
                          disabled={isPending || index === items.length - 1}
                          onClick={() =>
                            run(
                              () => moveAction(item.id, "down"),
                              "순서를 바꾸지 못했습니다.",
                            )
                          }
                        >
                          <ChevronDownIcon aria-hidden="true" />
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      aria-label={`${item.title} ${item.visible ? "숨기기" : "공개하기"}`}
                      onClick={() =>
                        run(
                          () => toggleAction(item.id, !item.visible),
                          "공개 상태를 바꾸지 못했습니다.",
                        )
                      }
                    >
                      {item.visible ? "숨기기" : "공개하기"}
                    </Button>
                    <Link
                      href={`${editBasePath}/${item.id}/edit`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      aria-label={`${item.title} 수정`}
                    >
                      수정
                    </Link>
                    <DeleteItemDialog
                      itemName={item.title}
                      title={`${noun} 삭제`}
                      description={`‘${item.title}’ 삭제는 되돌릴 수 없습니다.`}
                      onDelete={() => deleteAction(item.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
