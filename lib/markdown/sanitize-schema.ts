import { defaultSchema } from "rehype-sanitize";

const defaultAttributes = defaultSchema.attributes ?? {};

// 본문에서 허용하는 class: 사용자 스타일용 post- 접두, remark-math가 붙이는 math-*, 코드 언어 표시.
// 그 외 class(예: evil)는 배열 토큰별로 걸러진다.
const allowedClassNames: [string, ...(string | RegExp)[]] = [
  "className",
  /^post-/,
  "math-inline",
  "math-display",
  /^language-/,
];

// 기본 스키마(GitHub 수준)에 글 본문용 확장만 더한다. script, on* 속성, javascript: 프로토콜은
// 기본 스키마가 이미 제거하므로 허용 목록에 추가하지 않는다. details/summary도 기본 허용이다.
export const sanitizeSchema: typeof defaultSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    "style",
    "figure",
    "figcaption",
  ],
  attributes: {
    ...defaultAttributes,
    "*": [...(defaultAttributes["*"] ?? []), allowedClassNames],
    img: [...(defaultAttributes.img ?? []), "loading", "width", "height"],
    // span의 style은 `color: #hex` 한 가지 형태만 통과한다. 값이 패턴과 다르면 속성 전체가 제거된다.
    span: [
      ...(defaultAttributes.span ?? []),
      ["style", /^\s*color:\s*#[0-9a-fA-F]{3,8}\s*;?\s*$/],
    ],
  },
};
