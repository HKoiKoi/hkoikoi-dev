// blog-images 버킷 목록·삭제 I/O 어댑터. SupabaseClient를 인자로 받아 테스트하기 쉽게 둔다.
// 목록 조회는 관리자 SELECT 정책(blog_images_select_admin)이 있어야 동작하므로
// 호출 측은 requireAdmin() 이후에만 사용한다. 실패는 빈 결과로 삼키지 않고 던진다
// (목록 실패를 "객체 없음"으로 취급하면 안 되기 때문이다).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { StorageObjectInfo } from "@/lib/storage/find-orphans";
import type { Database } from "@/lib/supabase/database.types";

const BUCKET = "blog-images";
const PAGE_SIZE = 100;
// 업로드 경로는 YYYY/MM/<file>(깊이 2)이다. 비정상적으로 깊은 폴더는 따라가지 않는다.
const MAX_DEPTH = 4;

type Client = SupabaseClient<Database>;

async function walk(
  supabase: Client,
  prefix: string,
  depth: number,
  out: StorageObjectInfo[],
): Promise<void> {
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: PAGE_SIZE, offset });
    if (error) {
      throw new Error(`Storage list 실패 (${prefix || "/"}): ${error.message}`);
    }

    for (const item of data) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        const size = Number(
          (item.metadata as { size?: unknown } | null)?.size ?? 0,
        );
        out.push({
          path,
          size: Number.isFinite(size) ? size : 0,
          createdAt: item.created_at ?? "",
        });
      } else if (depth < MAX_DEPTH) {
        // id가 없는 항목은 폴더다.
        await walk(supabase, path, depth + 1, out);
      }
    }

    if (data.length < PAGE_SIZE) return;
  }
}

/** 버킷의 모든 파일 객체를 폴더를 따라 내려가며 모은다. */
export async function listBlogImages(
  supabase: Client,
): Promise<StorageObjectInfo[]> {
  const out: StorageObjectInfo[] = [];
  await walk(supabase, "", 0, out);
  return out;
}

/** 경로 배치를 삭제하고 실제로 지워진 개수를 돌려준다. */
export async function removeBlogImages(
  supabase: Client,
  paths: ReadonlyArray<string>,
): Promise<number> {
  if (paths.length === 0) return 0;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .remove([...paths]);
  if (error) throw new Error(`Storage remove 실패: ${error.message}`);
  return data.length;
}
