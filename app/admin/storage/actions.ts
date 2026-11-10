"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { getAdminPostReferences } from "@/lib/queries/admin-posts";
import { collectReferencedPaths } from "@/lib/storage/extract-image-paths";
import { filterOrphans } from "@/lib/storage/find-orphans";
import {
  listBlogImages,
  removeBlogImages,
} from "@/lib/storage/storage-adapter";
import { createClient } from "@/lib/supabase/server";

const MAX_PATHS = 100;
const DELETE_FAILED =
  "이미지를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";

// buildImagePath가 만드는 YYYY/MM/<uuid>.<ext> 형식만 허용한다.
const IMAGE_PATH =
  /^\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|gif)$/;

const pathsSchema = z.array(z.string().regex(IMAGE_PATH)).min(1).max(MAX_PATHS);

export type DeleteOrphansResult = {
  ok: boolean;
  deleted: number;
  skippedReferenced: number;
  skippedGrace: number;
  /** 이미 사라졌거나 버킷에 없는 경로 */
  skippedMissing: number;
  failed: number;
  message: string;
};

function empty(message: string): DeleteOrphansResult {
  return {
    ok: false,
    deleted: 0,
    skippedReferenced: 0,
    skippedGrace: 0,
    skippedMissing: 0,
    failed: 0,
    message,
  };
}

/**
 * 선택한 고아 이미지를 삭제한다. 클라이언트가 보낸 경로는 신뢰하지 않고,
 * 삭제 직전에 참조 집합과 버킷 목록을 다시 계산해 "존재하고, 참조되지 않고,
 * 유예 기간이 지난" 경로만 지운다. 참조 조회나 목록이 실패하면 아무것도 지우지 않는다.
 */
export async function deleteOrphans(
  paths: string[],
): Promise<DeleteOrphansResult> {
  await requireAdmin();

  const parsed = pathsSchema.safeParse(paths);
  if (!parsed.success) {
    return empty(`삭제할 이미지 경로를 확인해 주세요. (최대 ${MAX_PATHS}개)`);
  }
  const requested = [...new Set(parsed.data)];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return empty(DELETE_FAILED);

  const result = empty("");

  try {
    const references = await getAdminPostReferences();
    if (references === null) {
      return empty("글 참조를 확인하지 못해 삭제하지 않았습니다.");
    }

    const supabase = await createClient();
    const objects = await listBlogImages(supabase);

    const referenced = collectReferencedPaths(references, supabaseUrl);
    const eligible = new Set(
      filterOrphans(objects, referenced, new Date()).map((o) => o.path),
    );
    const existing = new Set(objects.map((o) => o.path));

    const toDelete: string[] = [];
    for (const path of requested) {
      if (referenced.has(path)) result.skippedReferenced += 1;
      else if (eligible.has(path)) toDelete.push(path);
      else if (existing.has(path)) result.skippedGrace += 1;
      else result.skippedMissing += 1;
    }

    if (toDelete.length > 0) {
      try {
        result.deleted = await removeBlogImages(supabase, toDelete);
      } catch (error) {
        unstable_rethrow(error);
        console.error("[deleteOrphans:remove]", error);
      }
      result.failed = toDelete.length - result.deleted;
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deleteOrphans]", error);
    return empty(DELETE_FAILED);
  }

  revalidatePath("/admin/storage");

  const parts = [`${result.deleted}개 삭제`];
  if (result.skippedReferenced > 0) {
    parts.push(`참조 중 ${result.skippedReferenced}개 건너뜀`);
  }
  if (result.skippedGrace > 0) {
    parts.push(`유예 기간 ${result.skippedGrace}개 건너뜀`);
  }
  if (result.skippedMissing > 0) {
    parts.push(`이미 없음 ${result.skippedMissing}개`);
  }
  if (result.failed > 0) parts.push(`실패 ${result.failed}개`);

  return {
    ...result,
    ok: result.failed === 0,
    message: `${parts.join(", ")}.`,
  };
}
