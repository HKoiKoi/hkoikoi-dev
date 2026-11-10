// 본문 <style>의 규칙이 글 본문 래퍼 안에서만 적용되도록 모든 선택자 앞에 래퍼 클래스를 붙인다.
// sanitize-style 뒤에 실행하므로 입력은 이미 단순한 일반 규칙이지만, 단독으로 호출돼도
// 예외 없이 동작하도록 주석·빈 규칙·@-규칙을 직접 처리한다.
import { findOutside, splitOutside } from "./rehype-sanitize-style";

// 글 id(uuid)나 'preview'처럼 값이 달라도 클래스 이름으로 안전하게 쓰이게 정규화한다.
export function scopeClassName(scopeId: string): string {
  return `post-scope-${scopeId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

export function scopeCss(css: string, scopeId: string): string {
  const scope = `.${scopeClassName(scopeId)}`;
  const source = css.replace(/\/\*[\s\S]*?(?:\*\/|$)/g, "");
  const rules: string[] = [];
  let pos = 0;

  while (pos < source.length) {
    // 블록 없는 문장(@import 'x';)이 뒤 규칙의 prelude에 섞이지 않도록 ;에서도 멈춘다.
    const open = findOutside(source, pos, "{;");
    if (open === -1) break;
    if (source[open] === ";") {
      pos = open + 1;
      continue;
    }

    const prelude = source.slice(pos, open).trim();
    let depth = 1;
    let end = open + 1;
    while (end < source.length && depth > 0) {
      const next = findOutside(source, end, "{}");
      if (next === -1) {
        end = source.length;
        break;
      }
      depth += source[next] === "{" ? 1 : -1;
      end = next + 1;
    }
    // 닫히지 않은 블록은 어디까지가 규칙인지 알 수 없어 나머지를 버린다.
    if (depth > 0) break;
    pos = end;

    // @-규칙은 선택자가 없어 접두할 수 없고, 범위를 벗어날 수 있어 남기지 않는다.
    if (!prelude || prelude.startsWith("@")) continue;
    const selectors = splitOutside(prelude, ",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (selectors.length === 0) continue;

    const block = source.slice(open + 1, end - 1).trim();
    rules.push(
      `${selectors.map((s) => `${scope} ${s}`).join(", ")} { ${block} }`,
    );
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

function scopeStyleElements(node: HastNode, scopeId: string) {
  if (node.type === "element" && node.tagName === "style") {
    for (const child of node.children ?? []) {
      if (child.type === "text" || child.type === "raw") {
        child.value = scopeCss(child.value ?? "", scopeId);
      }
    }
    return;
  }
  node.children?.forEach((child) => scopeStyleElements(child, scopeId));
}

export function rehypeScopeStyle({ scopeId }: { scopeId: string }) {
  return (tree: HastNode) => {
    scopeStyleElements(tree, scopeId);
  };
}
