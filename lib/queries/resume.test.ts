import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.hoisted(() => vi.fn());
const cacheTagMock = vi.hoisted(() => vi.fn());
const cacheLifeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: createClientMock,
}));
vi.mock("next/cache", () => ({
  cacheTag: cacheTagMock,
  cacheLife: cacheLifeMock,
}));

import { RESUME_SECTIONS } from "@/lib/types/resume";
import { getProjects, getPublications, getResumeEntries } from "./resume";

type Result = {
  data: unknown;
  error: { message: string } | null;
};

// 체이닝 가능하고 await하면 result로 풀리는 가짜 쿼리 빌더
function createBuilder(result: Result) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: (
      resolve: (value: Result) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  for (const key of ["select", "eq", "order"] as const) {
    builder[key].mockReturnValue(builder);
  }
  const from = vi.fn(() => builder);
  createClientMock.mockReturnValue({ from });
  return { builder, from };
}

const ok = (data: unknown): Result => ({ data, error: null });
const fail: Result = { data: null, error: { message: "boom" } };

const entryRow = {
  title: "서울신학대학교",
  subtitle: null,
  period: null,
  description: null,
  grade: null,
  grade_label: null,
  tags: [],
  tag_groups: [],
  link: null,
};

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  errorSpy.mockRestore();
});

describe("getResumeEntries", () => {
  it("섹션·공개 조건·sort_order 오름차순으로 조회한다", async () => {
    const { builder, from } = createBuilder(ok([]));

    await getResumeEntries("career");

    expect(from).toHaveBeenCalledWith("resume_entries");
    expect(builder.eq).toHaveBeenCalledWith("section", "career");
    expect(builder.eq).toHaveBeenCalledWith("is_visible", true);
    expect(builder.order).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
    expect(builder.order).toHaveBeenNthCalledWith(2, "id", {
      ascending: true,
    });
  });

  it("id·created_at 등 표시에 쓰지 않는 컬럼은 select하지 않는다", async () => {
    const { builder } = createBuilder(ok([]));

    await getResumeEntries("education");

    const columns = builder.select.mock.calls[0][0] as string;
    expect(columns.split(", ")).not.toContain("id");
    expect(columns).not.toContain("created_at");
    expect(columns).not.toContain("sort_order");
  });

  it("null·빈 배열은 undefined로 바꾸고 값이 있으면 표시용 모양으로 매핑한다", async () => {
    createBuilder(
      ok([
        entryRow,
        {
          title: "(주)신나는플랫폼",
          subtitle: "기술연구소",
          period: "2024.07.15 ~ 2025.12.31",
          description: "첫 줄\n둘째 줄",
          grade: "4.2 / 4.5",
          grade_label: "평점",
          tags: ["Java"],
          tag_groups: [{ label: "개발", tags: ["Java", "React"] }],
          link: "https://example.com",
        },
      ]),
    );

    const entries = await getResumeEntries("career");

    expect(entries[0]).toEqual({
      title: "서울신학대학교",
      subtitle: undefined,
      period: undefined,
      description: undefined,
      grade: undefined,
      gradeLabel: undefined,
      tags: undefined,
      tagGroups: undefined,
      link: undefined,
    });
    expect(entries[1]).toEqual({
      title: "(주)신나는플랫폼",
      subtitle: "기술연구소",
      period: "2024.07.15 ~ 2025.12.31",
      description: "첫 줄\n둘째 줄",
      grade: "4.2 / 4.5",
      gradeLabel: "평점",
      tags: ["Java"],
      tagGroups: [{ label: "개발", tags: ["Java", "React"] }],
      link: "https://example.com",
    });
  });

  it("조회 순서(sort_order)를 그대로 유지한다", async () => {
    createBuilder(
      ok([
        { ...entryRow, title: "A" },
        { ...entryRow, title: "B" },
        { ...entryRow, title: "C" },
      ]),
    );

    const entries = await getResumeEntries("education");

    expect(entries.map((entry) => entry.title)).toEqual(["A", "B", "C"]);
  });

  it("tag_groups에서 형태가 맞지 않는 값은 버린다", async () => {
    createBuilder(
      ok([
        {
          ...entryRow,
          tag_groups: [
            { label: "정상", tags: ["a", 1, "b"] },
            { label: 3, tags: ["x"] },
            { label: "tags 없음" },
            null,
            "문자열",
          ],
        },
        { ...entryRow, tag_groups: { label: "배열 아님" } },
        { ...entryRow, tag_groups: [{ label: 3 }] },
      ]),
    );

    const entries = await getResumeEntries("career");

    expect(entries[0].tagGroups).toEqual([{ label: "정상", tags: ["a", "b"] }]);
    expect(entries[1].tagGroups).toBeUndefined();
    expect(entries[2].tagGroups).toBeUndefined();
  });

  it("resume과 resume:<section> 태그를 붙이고 수명은 max다", async () => {
    createBuilder(ok([]));

    await getResumeEntries("volunteer");

    expect(cacheTagMock).toHaveBeenCalledWith("resume", "resume:volunteer");
    expect(cacheLifeMock).toHaveBeenCalledTimes(1);
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
  });

  it.each(RESUME_SECTIONS)("%s 섹션은 자신의 태그를 쓴다", async (section) => {
    createBuilder(ok([]));

    await getResumeEntries(section);

    expect(cacheTagMock).toHaveBeenCalledWith("resume", `resume:${section}`);
  });

  it("오류 결과는 수명을 0으로 줄여 캐시에 저장되지 않게 하고 []를 반환한다", async () => {
    createBuilder(fail);

    await expect(getResumeEntries("career")).resolves.toEqual([]);

    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 0,
      revalidate: 0,
      expire: 0,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("data가 null이면 []를 반환한다", async () => {
    createBuilder(ok(null));

    await expect(getResumeEntries("career")).resolves.toEqual([]);
  });

  it("클라이언트 생성이 던져도 []를 반환하고 로그를 남긴다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getResumeEntries("career")).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getProjects", () => {
  const projectRow = {
    name: "hkoikoi.dev",
    summary: "요약",
    period: "2026.10",
    role: "개인 프로젝트",
    stack: ["Next.js"],
    github_url: "https://github.com/HKoiKoi/hkoikoi-dev",
    demo_url: null,
    featured: true,
  };

  it("공개 조건·sort_order 오름차순으로 조회한다", async () => {
    const { builder, from } = createBuilder(ok([]));

    await getProjects();

    expect(from).toHaveBeenCalledWith("projects");
    expect(builder.eq).toHaveBeenCalledWith("is_visible", true);
    expect(builder.order).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
  });

  it("링크 컬럼을 links로, featured를 불리언으로 매핑한다", async () => {
    createBuilder(
      ok([
        projectRow,
        {
          ...projectRow,
          name: "SCO",
          demo_url: "https://sco.hkoikoi.dev",
          featured: false,
        },
        { ...projectRow, name: "링크 없음", github_url: null },
      ]),
    );

    const projects = await getProjects();

    expect(projects[0]).toEqual({
      name: "hkoikoi.dev",
      summary: "요약",
      period: "2026.10",
      role: "개인 프로젝트",
      stack: ["Next.js"],
      links: { github: "https://github.com/HKoiKoi/hkoikoi-dev" },
      featured: true,
    });
    expect(projects[1].links).toEqual({
      github: "https://github.com/HKoiKoi/hkoikoi-dev",
      demo: "https://sco.hkoikoi.dev",
    });
    expect(projects[1].featured).toBeUndefined();
    expect(projects[2].links).toEqual({});
  });

  it("projects 태그를 붙인다", async () => {
    createBuilder(ok([]));

    await getProjects();

    expect(cacheTagMock).toHaveBeenCalledWith("projects");
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
  });

  it("오류면 수명을 0으로 줄이고 []를 반환한다", async () => {
    createBuilder(fail);

    await expect(getProjects()).resolves.toEqual([]);

    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 0,
      revalidate: 0,
      expire: 0,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 []를 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getProjects()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});

describe("getPublications", () => {
  const pubRow = (title: string, year: number, link: string | null = null) => ({
    title,
    authors: "저자",
    venue: "학회",
    year,
    link,
  });

  it("공개 조건·sort_order 오름차순으로 조회한다", async () => {
    const { builder, from } = createBuilder(ok([]));

    await getPublications();

    expect(from).toHaveBeenCalledWith("publications");
    expect(builder.eq).toHaveBeenCalledWith("is_visible", true);
    expect(builder.order).toHaveBeenNthCalledWith(1, "sort_order", {
      ascending: true,
    });
  });

  it("연도 내림차순으로 정렬하고 같은 연도는 조회 순서를 유지한다", async () => {
    createBuilder(
      ok([
        pubRow("2025-a", 2025),
        pubRow("2026-a", 2026),
        pubRow("2025-b", 2025),
        pubRow("2026-b", 2026),
      ]),
    );

    const items = await getPublications();

    expect(items.map((item) => item.title)).toEqual([
      "2026-a",
      "2026-b",
      "2025-a",
      "2025-b",
    ]);
  });

  it("link는 null이면 undefined로 바꾼다", async () => {
    createBuilder(
      ok([pubRow("a", 2026, "https://example.com"), pubRow("b", 2026)]),
    );

    const items = await getPublications();

    expect(items[0]).toEqual({
      title: "a",
      authors: "저자",
      venue: "학회",
      year: 2026,
      link: "https://example.com",
    });
    expect(items[1].link).toBeUndefined();
  });

  it("publications 태그를 붙인다", async () => {
    createBuilder(ok([]));

    await getPublications();

    expect(cacheTagMock).toHaveBeenCalledWith("publications");
    expect(cacheLifeMock).toHaveBeenCalledWith("max");
  });

  it("오류면 수명을 0으로 줄이고 []를 반환한다", async () => {
    createBuilder(fail);

    await expect(getPublications()).resolves.toEqual([]);

    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 0,
      revalidate: 0,
      expire: 0,
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("클라이언트 생성이 던져도 []를 반환한다", async () => {
    createClientMock.mockImplementation(() => {
      throw new Error("no env");
    });

    await expect(getPublications()).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });
});
