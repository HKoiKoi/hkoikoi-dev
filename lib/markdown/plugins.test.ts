import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { describe, expect, it } from "vitest";

import { rehypePlugins, remarkPlugins } from "./plugins";
import { rehypeSanitizeStyle } from "./rehype-sanitize-style";
import { sanitizeSchema } from "./sanitize-schema";

const pluginFn = (entry: unknown) => (Array.isArray(entry) ? entry[0] : entry);

describe("sanitizeSchema", () => {
  it("style, figure, figcaption, details, summary를 허용한다", () => {
    for (const tag of ["style", "figure", "figcaption", "details", "summary"]) {
      expect(sanitizeSchema.tagNames).toContain(tag);
    }
  });

  it("script는 허용하지 않는다", () => {
    expect(sanitizeSchema.tagNames).not.toContain("script");
  });

  it("id는 user-content- 접두를 유지한다", () => {
    expect(sanitizeSchema.clobberPrefix).toBe("user-content-");
  });

  it("img에 loading, width, height를 허용한다", () => {
    expect(sanitizeSchema.attributes?.img).toEqual(
      expect.arrayContaining(["loading", "width", "height"]),
    );
  });
});

describe("plugins", () => {
  it("remark는 gfm 다음 math 순서다", () => {
    expect(remarkPlugins).toHaveLength(2);
  });

  it("rehype 순서는 raw → sanitize → sanitize-style → katex → highlight로 고정된다", () => {
    expect(rehypePlugins.map(pluginFn)).toEqual([
      rehypeRaw,
      rehypeSanitize,
      rehypeSanitizeStyle,
      rehypeKatex,
      rehypeHighlight,
    ]);
  });

  it("sanitize에 확장 스키마를, katex에 trust:false·throwOnError:false를 넘긴다", () => {
    expect(rehypePlugins[1]).toEqual([rehypeSanitize, sanitizeSchema]);
    expect(rehypePlugins[3]).toEqual([
      rehypeKatex,
      { trust: false, throwOnError: false },
    ]);
  });
});
