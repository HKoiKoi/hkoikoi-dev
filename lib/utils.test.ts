import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("클래스를 병합하고 Tailwind 충돌은 마지막 값이 이긴다", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("falsy 값은 무시한다", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
