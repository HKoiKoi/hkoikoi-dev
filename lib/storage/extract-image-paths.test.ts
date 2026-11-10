import { describe, expect, it } from "vitest";

import {
  collectReferencedPaths,
  extractImagePaths,
} from "./extract-image-paths";

const BASE = "https://abc.supabase.co";
const PUBLIC = `${BASE}/storage/v1/object/public/blog-images`;

describe("extractImagePaths", () => {
  it("마크다운 이미지에서 경로를 추출한다", () => {
    const content = `![설명](${PUBLIC}/2026/11/a.png)`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/a.png"]),
    );
  });

  it("마크다운 이미지의 제목 부분(공백 뒤)은 경로에 넣지 않는다", () => {
    const content = `![](${PUBLIC}/2026/11/a.png "제목")`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/a.png"]),
    );
  });

  it("raw HTML img src(큰따옴표·작은따옴표)에서 추출한다", () => {
    const content = `<img src="${PUBLIC}/2026/11/a.png" alt="x"><img src='${PUBLIC}/2026/10/b.webp'>`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/a.png", "2026/10/b.webp"]),
    );
  });

  it("쿼리스트링과 해시를 버린다", () => {
    const content = `![](${PUBLIC}/2026/11/a.png?width=200) ![](${PUBLIC}/2026/11/b.png#top)`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/a.png", "2026/11/b.png"]),
    );
  });

  it("퍼센트 인코딩 경로를 디코딩한다", () => {
    const content = `![](${PUBLIC}/2026/11/%ED%95%9C%EA%B8%80.png)`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/한글.png"]),
    );
  });

  it("잘못된 퍼센트 시퀀스는 원문 그대로 둔다", () => {
    const content = `![](${PUBLIC}/2026/11/%E0%A4%A.png)`;
    expect(extractImagePaths(content, BASE)).toEqual(
      new Set(["2026/11/%E0%A4%A.png"]),
    );
  });

  it("다른 버킷 URL은 제외한다", () => {
    const content = `![](${BASE}/storage/v1/object/public/other-bucket/2026/11/a.png)`;
    expect(extractImagePaths(content, BASE).size).toBe(0);
  });

  it("외부 도메인의 같은 모양 경로는 제외한다", () => {
    const content = `![](https://evil.example.com/storage/v1/object/public/blog-images/2026/11/a.png)`;
    expect(extractImagePaths(content, BASE).size).toBe(0);
  });

  it("supabaseUrl 끝의 슬래시를 무시한다", () => {
    const content = `![](${PUBLIC}/2026/11/a.png)`;
    expect(extractImagePaths(content, `${BASE}/`)).toEqual(
      new Set(["2026/11/a.png"]),
    );
  });

  it("같은 경로를 여러 번 써도 한 번만 센다", () => {
    const content = `![](${PUBLIC}/2026/11/a.png) ![](${PUBLIC}/2026/11/a.png)`;
    expect(extractImagePaths(content, BASE).size).toBe(1);
  });

  it("빈 입력이면 빈 집합을 돌려준다", () => {
    expect(extractImagePaths("", BASE).size).toBe(0);
    expect(extractImagePaths(`![](${PUBLIC}/2026/11/a.png)`, "").size).toBe(0);
  });
});

describe("collectReferencedPaths", () => {
  it("본문과 썸네일의 합집합을 돌려준다", () => {
    const posts = [
      { content: `![](${PUBLIC}/2026/11/a.png)`, thumbnail_url: null },
      {
        content: "본문 이미지 없음",
        thumbnail_url: `${PUBLIC}/2026/11/thumb.webp`,
      },
      {
        content: `![](${PUBLIC}/2026/11/a.png)`,
        thumbnail_url: `${PUBLIC}/2026/10/t2.png?v=1`,
      },
    ];
    expect(collectReferencedPaths(posts, BASE)).toEqual(
      new Set(["2026/11/a.png", "2026/11/thumb.webp", "2026/10/t2.png"]),
    );
  });

  it("외부 썸네일 URL은 무시한다", () => {
    const posts = [
      { content: "", thumbnail_url: "https://example.com/thumb.png" },
    ];
    expect(collectReferencedPaths(posts, BASE).size).toBe(0);
  });

  it("글이 없으면 빈 집합이다", () => {
    expect(collectReferencedPaths([], BASE).size).toBe(0);
  });
});
