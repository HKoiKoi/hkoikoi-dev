import { describe, expect, it } from "vitest";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  buildImagePath,
  validateImage,
} from "./validate-image";

function makeFile(type: string, size = 10, name = "a.bin"): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validateImage", () => {
  it.each(Object.keys(ALLOWED_IMAGE_TYPES))("%s 형식을 통과시킨다", (type) => {
    expect(validateImage(makeFile(type))).toBeNull();
  });

  it.each(["image/svg+xml", "application/pdf", ""])(
    "허용되지 않은 형식(%j)을 거부한다",
    (type) => {
      expect(validateImage(makeFile(type))).toBe(
        "jpeg/png/webp/gif만 가능합니다",
      );
    },
  );

  it("정확히 5MB는 통과하고 1바이트 초과는 거부한다", () => {
    expect(validateImage(makeFile("image/png", MAX_IMAGE_BYTES))).toBeNull();
    expect(validateImage(makeFile("image/png", MAX_IMAGE_BYTES + 1))).toBe(
      "5MB 이하만 가능합니다",
    );
  });
});

describe("buildImagePath", () => {
  const pattern = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

  it("YYYY/MM/<uuid>.<ext> 형식이다", () => {
    expect(buildImagePath(makeFile("image/jpeg"))).toMatch(pattern);
  });

  it("주입한 now의 연월을 사용한다(1월·12월 경계)", () => {
    const file = makeFile("image/png");
    expect(buildImagePath(file, new Date(2026, 0, 1))).toMatch(/^2026\/01\//);
    expect(buildImagePath(file, new Date(2026, 11, 31))).toMatch(/^2026\/12\//);
  });

  it("확장자는 파일명이 아니라 type에서 도출한다", () => {
    expect(buildImagePath(makeFile("image/webp", 10, "evil.exe"))).toMatch(
      /\.webp$/,
    );
    expect(buildImagePath(makeFile("image/jpeg", 10, "a.png"))).toMatch(
      /\.jpg$/,
    );
  });

  it("호출마다 경로가 다르다", () => {
    const file = makeFile("image/gif");
    expect(buildImagePath(file)).not.toBe(buildImagePath(file));
  });

  it("허용되지 않은 형식이면 throw한다", () => {
    expect(() => buildImagePath(makeFile("image/svg+xml"))).toThrow();
  });
});
