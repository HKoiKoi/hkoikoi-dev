import { beforeEach, describe, expect, it, vi } from "vitest";

const upload = vi.fn();
const getPublicUrl = vi.fn();
const from = vi.fn(() => ({ upload, getPublicUrl }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ storage: { from } }),
}));

import { uploadImage } from "./upload-image";

function makeFile(type: string, size = 10): File {
  const file = new File(["x"], "a.bin", { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("uploadImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockResolvedValue({ error: null });
    getPublicUrl.mockReturnValue({
      data: { publicUrl: "https://cdn.test/img.png" },
    });
  });

  it("업로드 후 공개 URL을 반환한다", async () => {
    await expect(uploadImage(makeFile("image/png"))).resolves.toBe(
      "https://cdn.test/img.png",
    );
    expect(from).toHaveBeenCalledWith("blog-images");
  });

  it("upsert false와 contentType을 전달하고 같은 경로로 URL을 조회한다", async () => {
    const file = makeFile("image/webp");
    await uploadImage(file);

    const [path, sent, options] = upload.mock.calls[0];
    expect(path).toMatch(/^\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);
    expect(sent).toBe(file);
    expect(options).toEqual({ contentType: "image/webp", upsert: false });
    expect(getPublicUrl).toHaveBeenCalledWith(path);
  });

  it("업로드 오류면 한국어 메시지로 throw하고 원본은 cause에 둔다", async () => {
    const original = { message: "denied" };
    upload.mockResolvedValue({ error: original });

    const error = await uploadImage(makeFile("image/png")).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("이미지 업로드에 실패했습니다.");
    expect((error as Error).cause).toBe(original);
    expect(getPublicUrl).not.toHaveBeenCalled();
  });

  it("검증에 실패하면 업로드 요청 없이 throw한다", async () => {
    await expect(uploadImage(makeFile("image/svg+xml"))).rejects.toThrow(
      "jpeg/png/webp/gif만 가능합니다",
    );
    await expect(uploadImage(makeFile("image/png", 5242881))).rejects.toThrow(
      "5MB 이하만 가능합니다",
    );
    expect(upload).not.toHaveBeenCalled();
  });
});
