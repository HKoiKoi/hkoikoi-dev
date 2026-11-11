export type MoveDirection = "up" | "down";

/**
 * 순서 배열에서 id를 한 칸 옮긴 새 배열을 돌려준다.
 * id가 없거나 이미 맨 앞(up)·맨 뒤(down)면 null이다(호출 측은 쓰기를 하지 않는다).
 */
export function moveInList(
  ids: string[],
  id: string,
  direction: MoveDirection,
): string[] | null {
  const index = ids.indexOf(id);
  if (index === -1) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return null;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
