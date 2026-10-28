// 본문 <style>은 글 상세 페이지 전체에 적용되므로, sanitize를 통과한 뒤 CSS 내용을 한 번 더 걸러낸다.
// 허용 규칙: 모든 선택자가 .post- 또는 #user-content- 로 시작하는 일반 스타일 규칙.
// 제거: @-규칙 전부(@import, @font-face 등), 중첩 규칙, 형제·:has 같은 범위 이탈 선택자,
// url()·image-set() 등 외부 요청 함수, 이스케이프(\)가 든 규칙.

const ALLOWED_SELECTOR = /^(?:\.post-|#user-content-)[\w-]/;
// 선택 범위가 .post- 요소 밖으로 새거나 다른 요소를 조건으로 삼는 문법.
const ESCAPING_SELECTOR = /[~+]|:(?:has|is|where|not|host|root)\b/i;
const FORBIDDEN_VALUE =
  /url\(|image-set\(|image\(|expression\(|-moz-binding|behavior\s*:/i;
const PROPERTY_NAME = /^-?[a-z][a-z0-9-]*$/i;

// 문자열·괄호 안은 건너뛰고 stops 중 하나가 처음 나오는 위치를 돌려준다. 없으면 -1.
function findOutside(css: string, from: number, stops: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < css.length; i++) {
    const ch = css[i];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "(" || ch === "[") {
      depth++;
    } else if (ch === ")" || ch === "]") {
      depth = Math.max(0, depth - 1);
    } else if (depth === 0 && stops.includes(ch)) {
      return i;
    }
  }
  return -1;
}

function splitOutside(css: string, separator: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (;;) {
    const idx = findOutside(css, start, separator);
    if (idx === -1) {
      parts.push(css.slice(start));
      return parts;
    }
    parts.push(css.slice(start, idx));
    start = idx + 1;
  }
}

function sanitizeDeclarations(block: string): string[] {
  const declarations: string[] = [];
  for (const raw of splitOutside(block, ";")) {
    const declaration = raw.trim();
    if (!declaration) continue;
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!PROPERTY_NAME.test(property) && !property.startsWith("--")) continue;
    if (!value || FORBIDDEN_VALUE.test(value)) continue;
    declarations.push(`${property}: ${value}`);
  }
  return declarations;
}

function sanitizeRule(prelude: string, block: string): string | null {
  if (block.includes("{")) return null;
  const selectors = splitOutside(prelude, ",").map((s) => s.trim());
  const allowed = selectors.every(
    (s) => ALLOWED_SELECTOR.test(s) && !ESCAPING_SELECTOR.test(s),
  );
  if (!allowed) return null;
  const declarations = sanitizeDeclarations(block);
  if (declarations.length === 0) return null;
  return `${selectors.join(", ")} { ${declarations.join("; ")} }`;
}

export function sanitizeStyleCss(css: string): string {
  const source = css.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, "");
  const rules: string[] = [];
  let pos = 0;

  while (pos < source.length) {
    const stop = findOutside(source, pos, "{;");
    if (stop === -1) break;
    if (source[stop] === ";") {
      pos = stop + 1;
      continue;
    }

    const prelude = source.slice(pos, stop).trim();
    // 중괄호 깊이를 세어 블록 끝을 찾는다. 닫히지 않으면 나머지는 버린다.
    let depth = 1;
    let end = stop + 1;
    while (end < source.length && depth > 0) {
      const next = findOutside(source, end, "{}");
      if (next === -1) {
        end = source.length;
        break;
      }
      depth += source[next] === "{" ? 1 : -1;
      end = next + 1;
    }
    if (depth > 0) break;

    pos = end;
    if (prelude.startsWith("@") || prelude.includes("\\")) continue;
    const block = source.slice(stop + 1, end - 1);
    if (block.includes("\\")) continue;
    const rule = sanitizeRule(prelude, block);
    if (rule) rules.push(rule);
  }

  return rules.join("\n");
}

// hast 타입 패키지는 직접 의존성이 아니라 필요한 구조만 선언한다.
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
};

function sanitizeStyleElements(node: HastNode) {
  if (node.type === "element" && node.tagName === "style") {
    for (const child of node.children ?? []) {
      if (child.type === "text" || child.type === "raw") {
        child.value = sanitizeStyleCss(child.value ?? "");
      }
    }
    return;
  }
  node.children?.forEach(sanitizeStyleElements);
}

export function rehypeSanitizeStyle() {
  return (tree: HastNode) => {
    sanitizeStyleElements(tree);
  };
}
