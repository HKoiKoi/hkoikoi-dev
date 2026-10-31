"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage } from "@/lib/storage/upload-image";
import { ALLOWED_IMAGE_TYPES } from "@/lib/storage/validate-image";

const ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(",");

interface ThumbnailFieldProps {
  value: string;
  onChange: (url: string) => void;
  /** 서버 검증 오류 */
  error?: string;
  /** 업로드 시작·종료를 알려 저장 버튼 비활성화에 쓴다. */
  onBusyChange?: (busy: boolean) => void;
}

// 썸네일 업로드·미리보기·제거. 값은 hidden input(thumbnail_url)으로 폼에 전송된다.
export function ThumbnailField({
  value,
  onChange,
  error,
  onBusyChange,
}: ThumbnailFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const message = localError ?? error;

  async function handleFile(file: File) {
    setLocalError(null);
    setUploading(true);
    onBusyChange?.(true);
    try {
      onChange(await uploadImage(file));
    } catch (e) {
      setLocalError(
        e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setUploading(false);
      onBusyChange?.(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span id="post-thumbnail-label" className="text-sm font-medium">
        썸네일
      </span>
      <input type="hidden" name="thumbnail_url" value={value} />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        hidden
        aria-labelledby="post-thumbnail-label"
        data-testid="thumbnail-input"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      {value ? (
        // 업로드한 임의 URL이라 next/image 대신 img 사용 (공개 카드와 동일)
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="썸네일 미리보기"
          className="aspect-video w-full rounded-lg border object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          썸네일 없음
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          aria-describedby={message ? "post-thumbnail-error" : undefined}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "업로드 중…" : value ? "썸네일 변경" : "썸네일 업로드"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => {
              setLocalError(null);
              onChange("");
            }}
          >
            제거
          </Button>
        )}
      </div>
      {message && (
        <p
          id="post-thumbnail-error"
          role="alert"
          className="text-sm text-destructive"
        >
          {message}
        </p>
      )}
    </div>
  );
}
