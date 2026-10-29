// 키보드 사용자가 반복되는 헤더를 건너뛰어 본문(#main-content)으로 바로 이동하는 링크.
// 포커스를 받기 전에는 화면에서 숨겨진다.
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground ring-3 ring-ring focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:outline-none"
    >
      본문 바로가기
    </a>
  );
}
