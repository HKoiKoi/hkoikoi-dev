// 브라우저에서 blog-images 버킷으로 이미지를 직접 업로드한다(브라우저 전용, server.ts 사용 금지).
//
// - upsert를 쓰지 않는다: upsert는 INSERT+SELECT+UPDATE 권한이 필요한데 버킷에 select 정책이 없다.
//   경로가 매번 새 uuid라 덮어쓸 일도 없다.
// - 업로드 후 글을 저장하지 않거나 본문에서 이미지를 지워도 스토리지의 파일은 남는다.
//   이런 고아 파일은 관리자 화면 /admin/storage에서 확인하고 지운다(유예 7일, 삭제 직전 참조 재검사).
import { createClient } from "@/lib/supabase/client";

import { buildImagePath, validateImage } from "./validate-image";

const BUCKET = "blog-images";

/** 공개 URL을 반환한다. 검증·업로드에 실패하면 한국어 메시지의 Error를 던진다. */
export async function uploadImage(file: File): Promise<string> {
  const validationError = validateImage(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const path = buildImagePath(file);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    throw new Error("이미지 업로드에 실패했습니다.", { cause: error });
  }

  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
