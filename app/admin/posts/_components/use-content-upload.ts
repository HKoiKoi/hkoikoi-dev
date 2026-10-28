import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import {
  createUploadPlaceholder,
  insertAtCursor,
  replaceWithCaret,
} from "@/lib/editor/insert-at-cursor";
import { uploadImage } from "@/lib/storage/upload-image";
import { validateImage } from "@/lib/storage/validate-image";

// 마크다운 이미지 alt: 확장자를 뺀 파일명, 대괄호는 제거한다.
function toAltText(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
}

function pickImageFiles(files: FileList): File[] {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

// 본문 상태와 이미지 업로드·커서 삽입을 함께 관리한다. 업로드 결과가 본문 상태를 바꾸므로 한 훅에 둔다.
export function useContentUpload(initialContent: string) {
  // 본문은 편집기가 보유한다. 미리보기(MarkdownPreview)가 같은 값을 사용한다.
  const [content, setContent] = useState(initialContent);
  const contentRef = useRef(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  // 비동기 업로드 중에도 최신 본문을 기준으로 치환하기 위해 ref로 동기화한다.
  function updateContent(update: (prev: string) => string) {
    contentRef.current = update(contentRef.current);
    setContent(contentRef.current);
  }

  // 값이 렌더에 반영된 다음 프레임에 캐럿을 옮긴다.
  function moveCaret(position: number) {
    requestAnimationFrame(() => {
      textareaRef.current?.setSelectionRange(position, position);
    });
  }

  function addUploadError(message: string) {
    setUploadErrors((prev) => [...prev, message]);
  }

  // 파일을 순차 업로드한다. 각 파일은 시작 시점의 선택 영역에 자리표시를 넣고 결과로 치환한다.
  async function uploadFiles(files: File[]) {
    setUploadErrors([]);
    // 직전 파일을 치환한 뒤의 캐럿. DOM 선택 영역은 다음 렌더 전까지 옛 위치라 다음 파일 삽입에는 이 값을 쓴다.
    let nextCaret: number | null = null;
    for (const file of files) {
      const validationError = validateImage(file);
      if (validationError) {
        addUploadError(`${file.name}: ${validationError}`);
        continue;
      }

      const textarea = textareaRef.current;
      const start =
        nextCaret ?? textarea?.selectionStart ?? contentRef.current.length;
      const end =
        nextCaret ?? textarea?.selectionEnd ?? contentRef.current.length;
      const placeholder = createUploadPlaceholder(crypto.randomUUID());
      const inserted = insertAtCursor(
        contentRef.current,
        start,
        end,
        placeholder,
      );
      updateContent(() => inserted.value);
      moveCaret(inserted.cursor);

      // 치환 후에도 캐럿이 같은 글자 옆에 남도록 보정한다(URL 한가운데에 남아 이어 입력이 깨지는 것을 방지).
      const swapPlaceholder = (replacement: string) => {
        const el = textareaRef.current;
        const caret =
          el && document.activeElement === el
            ? el.selectionStart
            : inserted.cursor;
        const result = replaceWithCaret(
          contentRef.current,
          caret,
          placeholder,
          replacement,
        );
        updateContent(() => result.value);
        moveCaret(result.cursor);
        nextCaret = result.cursor;
      };

      setUploadingCount((count) => count + 1);
      try {
        const url = await uploadImage(file);
        swapPlaceholder(`![${toAltText(file.name)}](${url})`);
      } catch {
        swapPlaceholder("");
        addUploadError(`${file.name}: 이미지 업로드에 실패했습니다.`);
      } finally {
        setUploadingCount((count) => count - 1);
      }
    }
  }

  // 이미지 파일이 있을 때만 가로채고, 일반 텍스트 붙여넣기·드롭은 기본 동작을 유지한다.
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = pickImageFiles(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = pickImageFiles(event.dataTransfer.files);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  function handleDragOver(event: DragEvent<HTMLTextAreaElement>) {
    if (Array.from(event.dataTransfer.types).includes("Files")) {
      event.preventDefault();
    }
  }

  return {
    content,
    textareaRef,
    uploadingCount,
    uploadErrors,
    updateContent,
    uploadFiles,
    handlePaste,
    handleDrop,
    handleDragOver,
  };
}
