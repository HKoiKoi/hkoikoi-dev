// 편집기 textarea 커서 삽입과 업로드 자리표시 치환 (순수 함수, DOM 비의존)

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** 선택 영역이 있으면 대체하고, cursor는 삽입한 텍스트의 끝 위치를 반환한다. */
export function insertAtCursor(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  text: string,
): { value: string; cursor: number } {
  const start = clamp(Math.min(selectionStart, selectionEnd), 0, value.length);
  const end = clamp(Math.max(selectionStart, selectionEnd), 0, value.length);
  return {
    value: value.slice(0, start) + text + value.slice(end),
    cursor: start + text.length,
  };
}

/** target의 첫 항목만 replacement로 치환한다. target이 없으면 value를 그대로 반환한다. */
export function replaceOnce(
  value: string,
  target: string,
  replacement: string,
): string {
  // 정규식·String.replace를 쓰지 않아 target의 특수문자와 replacement의 `$` 패턴에 안전하다.
  const index = value.indexOf(target);
  if (index === -1) return value;
  return (
    value.slice(0, index) + replacement + value.slice(index + target.length)
  );
}

/** 업로드마다 고유한 자리표시. URL 자리에 id를 넣어 동시 업로드끼리 서로 치환되지 않게 한다. */
export function createUploadPlaceholder(id: string): string {
  return `![업로드 중…](#upload-${id})`;
}
