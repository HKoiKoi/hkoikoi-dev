import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { Options } from "react-markdown";

import { sanitizeSchema } from "./sanitize-schema";

// unified는 react-markdown의 하위 의존성이라 직접 import하지 않고 Options에서 타입을 얻는다.
type PluggableList = NonNullable<Options["remarkPlugins"]>;

export const remarkPlugins: PluggableList = [remarkGfm, remarkMath];

// 순서가 보안 경계다. rehype-raw가 raw HTML을 트리로 올린 뒤 rehype-sanitize가 위험 요소를 제거해야 한다.
// katex와 highlight는 sanitize 뒤에 실행해 그들이 만든 class·구조는 검사 대상에서 빠진다.
// 알 수 없는 코드 언어는 rehype-highlight가 예외 없이 건너뛰므로 별도 옵션이 필요 없다.
export const rehypePlugins: PluggableList = [
  rehypeRaw,
  [rehypeSanitize, sanitizeSchema],
  [rehypeKatex, { trust: false, throwOnError: false }],
  rehypeHighlight,
];
