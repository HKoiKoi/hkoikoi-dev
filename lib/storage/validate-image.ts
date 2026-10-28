// 이미지 업로드 전 검증과 스토리지 경로 생성 (순수 함수, DOM·Supabase 비의존)
// 상수 값은 supabase/migrations/20261026105803_create_blog_images_bucket.sql의
// 버킷 설정(file_size_limit 5242880, allowed_mime_types 4종)과 일치해야 한다. 한쪽을 바꾸면 다른 쪽도 바꾼다.

// MIME 타입 -> 확장자. SVG는 스크립트 삽입 위험이 있어 의도적으로 제외한다.
export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
} as const;

export const MAX_IMAGE_BYTES = 5242880; // 5MB

type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

function isAllowedImageType(type: string): type is AllowedImageType {
  return Object.hasOwn(ALLOWED_IMAGE_TYPES, type);
}

/** 통과하면 null, 실패하면 한국어 오류 메시지를 반환한다. */
export function validateImage(file: File): string | null {
  if (!isAllowedImageType(file.type)) {
    return "jpeg/png/webp/gif만 가능합니다";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "5MB 이하만 가능합니다";
  }
  return null;
}

/**
 * YYYY/MM/<uuid>.<ext> 경로를 만든다.
 * 확장자는 파일명이 아니라 file.type에서 도출한다(파일명 위조에 의존하지 않음).
 * 허용되지 않은 형식이면 throw하므로 호출 전에 validateImage를 통과해야 한다.
 */
export function buildImagePath(file: File, now: Date = new Date()): string {
  if (!isAllowedImageType(file.type)) {
    throw new Error("허용되지 않는 이미지 형식입니다");
  }
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES[file.type]}`;
}
