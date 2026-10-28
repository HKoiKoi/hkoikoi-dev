"use client";

import { ImagePlusIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ALLOWED_IMAGE_TYPES } from "@/lib/storage/validate-image";

const ACCEPT = Object.keys(ALLOWED_IMAGE_TYPES).join(",");

interface ImageUploadButtonProps {
  /** 선택한 파일 목록. 형식·크기 검증은 호출 측이 한다. */
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

// 숨김 file input을 여는 버튼. 같은 파일을 다시 고를 수 있도록 선택 후 값을 비운다.
export function ImageUploadButton({
  onFiles,
  disabled,
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        data-testid="image-upload-input"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) onFiles(files);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlusIcon aria-hidden="true" />
        이미지 추가
      </Button>
    </>
  );
}
