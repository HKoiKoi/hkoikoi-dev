import { unstable_rethrow } from "next/navigation";
import { getAdminPostReferences } from "@/lib/queries/admin-posts";
import { collectReferencedPaths } from "@/lib/storage/extract-image-paths";
import {
  DEFAULT_GRACE_DAYS,
  filterOrphans,
  type StorageObjectInfo,
} from "@/lib/storage/find-orphans";
import { listBlogImages } from "@/lib/storage/storage-adapter";
import { createClient } from "@/lib/supabase/server";

export type OrphanCandidatesResult =
  | { ok: true; candidates: StorageObjectInfo[]; total: number }
  | { ok: false; message: string };

/**
 * 고아 후보(참조되지 않고 유예 기간이 지난 객체)를 계산한다.
 * 글 참조 조회나 Storage 목록 중 하나라도 실패하면 후보를 만들지 않고 오류를 돌려준다.
 * 반드시 requireAdmin() 이후에 호출한다.
 */
export async function loadOrphanCandidates(
  now: Date = new Date(),
  graceDays: number = DEFAULT_GRACE_DAYS,
): Promise<OrphanCandidatesResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return { ok: false, message: "Supabase URL이 설정되지 않았습니다." };
  }

  try {
    const references = await getAdminPostReferences();
    if (references === null) {
      return { ok: false, message: "글 참조를 불러오지 못했습니다." };
    }

    const supabase = await createClient();
    const objects = await listBlogImages(supabase);
    const referenced = collectReferencedPaths(references, supabaseUrl);

    return {
      ok: true,
      candidates: filterOrphans(objects, referenced, now, graceDays),
      total: objects.length,
    };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[loadOrphanCandidates]", error);
    return { ok: false, message: "스토리지 목록을 불러오지 못했습니다." };
  }
}
