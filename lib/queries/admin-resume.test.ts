import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));

import {
  getAdminProject,
  getAdminProjects,
  getAdminPublication,
  getAdminPublications,
  getAdminResumeEntries,
  getAdminResumeEntry,
} from "./admin-resume";

type Result = { data: unknown; error: { message: string } | null };

// 체이닝 가능하고 await하면 result로 풀리는 가짜 쿼리 빌더
function createBuilder(result: Result) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (
      resolve: (value: Result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ["select", "eq", "order"] as const) {
    builder[key].mockReturnValue(builder);
  }
  const from = vi.fn(() => builder);
  createClientMock.mockResolvedValue({ from });
  return { builder, from };
}

const ok = (data: unknown): Result => ({ data, error: null });

const VALID_ID = "0b8f4a52-6f0e-4d6a-9c1e-2f5d3a7b9c10";

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  errorSpy.mockRestore();
});

describe("getAdminResumeEntries", () => {
  it("섹션으로 거르되 is_visible 필터 없이 sort_order·id 오름차순으로 조회한다", async () => {
    const rows = [{ id: "1" }];
    const { builder, from } = createBuilder(ok(rows));

    await expect(getAdminResumeEntries("career")).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("resume_entries");
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("section", "career");
    expect(builder.order.mock.calls).toEqual([
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("data가 null이면 []를 반환한다", async () => {
    createBuilder(ok(null));
    await expect(getAdminResumeEntries("career")).resolves.toEqual([]);
  });

  it("오류면 []를 반환하고 로그를 남긴다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminResumeEntries("career")).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("createClient가 던져도 []를 반환한다", async () => {
    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminResumeEntries("career")).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getAdminResumeEntry", () => {
  it("id로 maybeSingle 조회하고 is_visible 조건은 걸지 않는다", async () => {
    const row = { id: VALID_ID, is_visible: false };
    const { builder, from } = createBuilder(ok(row));

    await expect(getAdminResumeEntry(VALID_ID)).resolves.toEqual(row);

    expect(from).toHaveBeenCalledWith("resume_entries");
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("id", VALID_ID);
    expect(builder.maybeSingle).toHaveBeenCalled();
  });

  it("uuid 형식이 아니면 쿼리 없이 null을 반환한다", async () => {
    await expect(getAdminResumeEntry("nope")).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("없으면 null, 오류·예외도 null이고 로그를 남긴다", async () => {
    createBuilder(ok(null));
    await expect(getAdminResumeEntry(VALID_ID)).resolves.toBeNull();

    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminResumeEntry(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(1);

    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminResumeEntry(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});

describe("getAdminProjects / getAdminProject", () => {
  it("목록은 숨김 필터 없이 sort_order·id 오름차순이다", async () => {
    const rows = [{ id: "1" }];
    const { builder, from } = createBuilder(ok(rows));

    await expect(getAdminProjects()).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("projects");
    expect(builder.eq).not.toHaveBeenCalled();
    expect(builder.order.mock.calls).toEqual([
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("목록은 오류·예외면 []를 반환한다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminProjects()).resolves.toEqual([]);

    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminProjects()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("단건은 id로 maybeSingle 조회한다", async () => {
    const row = { id: VALID_ID };
    const { builder, from } = createBuilder(ok(row));

    await expect(getAdminProject(VALID_ID)).resolves.toEqual(row);

    expect(from).toHaveBeenCalledWith("projects");
    expect(builder.eq).toHaveBeenCalledWith("id", VALID_ID);
  });

  it("단건은 잘못된 id·오류·예외면 null이다", async () => {
    await expect(getAdminProject("x")).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();

    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminProject(VALID_ID)).resolves.toBeNull();

    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminProject(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});

describe("getAdminPublications / getAdminPublication", () => {
  it("목록은 year 내림차순 → sort_order → id 오름차순이고 숨김 필터가 없다", async () => {
    const rows = [{ id: "1" }];
    const { builder, from } = createBuilder(ok(rows));

    await expect(getAdminPublications()).resolves.toEqual(rows);

    expect(from).toHaveBeenCalledWith("publications");
    expect(builder.eq).not.toHaveBeenCalled();
    expect(builder.order.mock.calls).toEqual([
      ["year", { ascending: false }],
      ["sort_order", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("목록은 오류·예외면 []를 반환한다", async () => {
    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminPublications()).resolves.toEqual([]);

    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminPublications()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });

  it("단건은 id로 maybeSingle 조회한다", async () => {
    const row = { id: VALID_ID };
    const { builder, from } = createBuilder(ok(row));

    await expect(getAdminPublication(VALID_ID)).resolves.toEqual(row);

    expect(from).toHaveBeenCalledWith("publications");
    expect(builder.eq).toHaveBeenCalledWith("id", VALID_ID);
  });

  it("단건은 잘못된 id·오류·예외면 null이다", async () => {
    await expect(getAdminPublication("x")).resolves.toBeNull();
    expect(createClientMock).not.toHaveBeenCalled();

    createBuilder({ data: null, error: { message: "boom" } });
    await expect(getAdminPublication(VALID_ID)).resolves.toBeNull();

    createClientMock.mockRejectedValue(new Error("no cookies"));
    await expect(getAdminPublication(VALID_ID)).resolves.toBeNull();
    expect(errorSpy).toHaveBeenCalledTimes(2);
  });
});
