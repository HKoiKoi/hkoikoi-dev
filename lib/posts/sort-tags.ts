// 태그·카테고리 이름 정렬 규칙. 로케일 기본값에 의존하지 않고 그룹 순서를 코드로 고정해
// 서버(Node ICU)와 브라우저에서 같은 결과를 낸다.

type TagGroup = 0 | 1 | 2 | 3;

// 그룹 0: 숫자·ASCII 기호, 1: 영문, 2: 한글, 3: 그 밖의 문자.
// 한글을 영문보다 앞에 두고 싶으면 이 상수의 순서만 바꾼다.
const GROUP_ORDER: readonly TagGroup[] = [0, 1, 2, 3];

const GROUP_RANK = new Map<TagGroup, number>(
  GROUP_ORDER.map((group, rank) => [group, rank]),
);

// 영문은 대소문자를 무시하고, 숫자는 크기순(v2 < v10)으로 비교한다.
const englishCollator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});
const koreanCollator = new Intl.Collator("ko", { numeric: true });
const fallbackCollator = new Intl.Collator("en", { numeric: true });

const COLLATORS: Record<TagGroup, Intl.Collator> = {
  0: fallbackCollator,
  1: englishCollator,
  2: koreanCollator,
  3: fallbackCollator,
};

function isHangul(codePoint: number): boolean {
  return (
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) || // 완성형 음절
    (codePoint >= 0x1100 && codePoint <= 0x11ff) || // 자모
    (codePoint >= 0x3130 && codePoint <= 0x318f) // 호환 자모
  );
}

function isAsciiLetter(codePoint: number): boolean {
  return (
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a)
  );
}

function isAsciiDigitOrSymbol(codePoint: number): boolean {
  // 공백(0x20)부터 `~`(0x7e)까지 중 영문자를 뺀 나머지
  return codePoint >= 0x20 && codePoint <= 0x7e && !isAsciiLetter(codePoint);
}

function getGroup(name: string): TagGroup {
  const codePoint = name.codePointAt(0);
  if (codePoint === undefined) return 3;
  if (isAsciiLetter(codePoint)) return 1;
  if (isHangul(codePoint)) return 2;
  if (isAsciiDigitOrSymbol(codePoint)) return 0;
  return 3;
}

// Collator가 같다고 본 문자열(React/react)을 코드포인트 순으로 결정해 입력 순서와 무관하게 한다.
function compareCodePoints(a: string, b: string): number {
  const aPoints = Array.from(a);
  const bPoints = Array.from(b);
  const length = Math.min(aPoints.length, bPoints.length);
  for (let i = 0; i < length; i += 1) {
    const diff = aPoints[i].codePointAt(0)! - bPoints[i].codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return aPoints.length - bPoints.length;
}

export function compareTagNames(a: string, b: string): number {
  const groupA = getGroup(a);
  const groupB = getGroup(b);
  if (groupA !== groupB) {
    return GROUP_RANK.get(groupA)! - GROUP_RANK.get(groupB)!;
  }
  const result = COLLATORS[groupA].compare(a, b);
  return result !== 0 ? result : compareCodePoints(a, b);
}

// 원본 배열은 바꾸지 않고 정렬된 새 배열을 돌려준다.
export function sortTags(tags: string[]): string[] {
  return [...tags].sort(compareTagNames);
}
