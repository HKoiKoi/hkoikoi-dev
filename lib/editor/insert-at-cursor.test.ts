import { describe, expect, it } from "vitest";

import {
  createUploadPlaceholder,
  insertAtCursor,
  replaceOnce,
  replaceWithCaret,
} from "./insert-at-cursor";

describe("insertAtCursor", () => {
  it("커서만 있으면 그 위치에 삽입한다", () => {
    expect(insertAtCursor("abcd", 2, 2, "X")).toEqual({
      value: "abXcd",
      cursor: 3,
    });
  });

  it("선택 영역을 대체하고 커서를 삽입 텍스트 끝으로 옮긴다", () => {
    expect(insertAtCursor("abcdef", 1, 4, "XY")).toEqual({
      value: "aXYef",
      cursor: 3,
    });
  });

  it("start와 end가 뒤바뀌어도 같은 결과다", () => {
    expect(insertAtCursor("abcdef", 4, 1, "XY")).toEqual({
      value: "aXYef",
      cursor: 3,
    });
  });

  it("처음·끝·빈 문자열 경계에서 동작한다", () => {
    expect(insertAtCursor("abc", 0, 0, "X")).toEqual({
      value: "Xabc",
      cursor: 1,
    });
    expect(insertAtCursor("abc", 3, 3, "X")).toEqual({
      value: "abcX",
      cursor: 4,
    });
    expect(insertAtCursor("", 0, 0, "X")).toEqual({ value: "X", cursor: 1 });
  });

  it("범위를 벗어난 선택은 [0, length]로 맞춘다", () => {
    expect(insertAtCursor("abc", 10, 20, "X")).toEqual({
      value: "abcX",
      cursor: 4,
    });
    expect(insertAtCursor("abc", -5, 1, "X")).toEqual({
      value: "Xbc",
      cursor: 1,
    });
  });
});

describe("replaceOnce", () => {
  it("첫 항목만 치환한다", () => {
    expect(replaceOnce("a-a-a", "a", "X")).toBe("X-a-a");
  });

  it("target이 없으면 value를 그대로 반환한다", () => {
    expect(replaceOnce("abc", "z", "X")).toBe("abc");
  });

  it("특수문자와 `$` 패턴을 문자 그대로 다룬다", () => {
    expect(replaceOnce("a(b)*c", "(b)*", "$&")).toBe("a$&c");
  });
});

describe("createUploadPlaceholder", () => {
  it("id가 다르면 자리표시도 다르다", () => {
    expect(createUploadPlaceholder("1")).not.toBe(createUploadPlaceholder("2"));
  });

  it("id에 따른 토큰이 URL 자리에 들어간다", () => {
    expect(createUploadPlaceholder("abc")).toBe("![업로드 중…](#upload-abc)");
  });

  it("두 자리표시가 서로 치환되지 않는다", () => {
    const p1 = createUploadPlaceholder("1");
    const p2 = createUploadPlaceholder("2");
    const body = `${p1}\n${p2}`;
    expect(replaceOnce(body, p2, "![b](u2)")).toBe(`${p1}\n![b](u2)`);
    expect(replaceOnce(body, p1, "![a](u1)")).toBe(`![a](u1)\n${p2}`);
  });

  it("id가 다른 id의 접두사여도 서로 치환되지 않는다", () => {
    const p1 = createUploadPlaceholder("1");
    const p10 = createUploadPlaceholder("10");
    expect(replaceOnce(`${p10}${p1}`, p1, "X")).toBe(`${p10}X`);
  });
});

describe("replaceWithCaret", () => {
  // 'ab[XX]cd' 에서 target은 index 2..4
  const value = "ab[XX]cd";

  it("캐럿이 target 끝에 있으면 치환 텍스트 끝으로 옮긴다", () => {
    expect(replaceWithCaret(value, 6, "[XX]", "LONGER")).toEqual({
      value: "abLONGERcd",
      cursor: 8,
    });
  });

  it("캐럿이 target 뒤에 있으면 길이 차이만큼 민다", () => {
    expect(replaceWithCaret(value, 7, "[XX]", "LONGER")).toEqual({
      value: "abLONGERcd",
      cursor: 9,
    });
    expect(replaceWithCaret(value, 8, "[XX]", "")).toEqual({
      value: "abcd",
      cursor: 4,
    });
  });

  it("캐럿이 target 앞에 있으면 그대로 둔다", () => {
    expect(replaceWithCaret(value, 1, "[XX]", "LONGER").cursor).toBe(1);
  });

  it("캐럿이 target 안에 있으면 치환 텍스트 끝으로 옮긴다", () => {
    expect(replaceWithCaret(value, 4, "[XX]", "LONGER").cursor).toBe(8);
  });

  it("target이 없으면 value와 caret을 그대로 반환한다", () => {
    expect(replaceWithCaret(value, 3, "zzz", "Q")).toEqual({
      value,
      cursor: 3,
    });
  });
});
