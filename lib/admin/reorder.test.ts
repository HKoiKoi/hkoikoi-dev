import { describe, expect, it } from "vitest";

import { moveInList } from "./reorder";

describe("moveInList", () => {
  const ids = ["a", "b", "c"];

  it("위로 한 칸 옮긴다", () => {
    expect(moveInList(ids, "b", "up")).toEqual(["b", "a", "c"]);
  });

  it("아래로 한 칸 옮긴다", () => {
    expect(moveInList(ids, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("맨 앞의 위, 맨 뒤의 아래는 null이다", () => {
    expect(moveInList(ids, "a", "up")).toBeNull();
    expect(moveInList(ids, "c", "down")).toBeNull();
  });

  it("없는 id는 null이고 원본 배열은 바뀌지 않는다", () => {
    expect(moveInList(ids, "x", "up")).toBeNull();
    moveInList(ids, "b", "up");
    expect(ids).toEqual(["a", "b", "c"]);
  });
});
