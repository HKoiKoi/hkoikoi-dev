import { describe, expect, it } from "vitest";
import { z } from "zod";

import { formValues, validationFailure } from "./admin-form";

describe("formValues", () => {
  it("지정한 키만 문자열로 모으고 없는 키는 빈 문자열이다", () => {
    const fd = new FormData();
    fd.set("title", "제목");
    fd.set("extra", "무시");
    expect(formValues(fd, ["title", "link"])).toEqual({
      title: "제목",
      link: "",
    });
  });
});

describe("validationFailure", () => {
  it("필드 오류와 입력값을 담은 실패 상태를 만든다", () => {
    const fd = new FormData();
    fd.set("title", "");
    const parsed = z.object({ title: z.string().min(1, "필수") }).safeParse({
      title: "",
    });
    if (parsed.success) throw new Error("검증이 실패해야 한다");

    expect(validationFailure(parsed.error, fd, ["title"])).toEqual({
      ok: false,
      message: "입력값을 확인해 주세요.",
      fieldErrors: { title: ["필수"] },
      values: { title: "" },
    });
  });
});
