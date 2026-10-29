"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { parsePostFormData } from "@/lib/posts/form-data";
import { resolvePublishedAt } from "@/lib/posts/published-at";
import { postSchema, type PostActionState } from "@/lib/schemas/post";
import { createClient } from "@/lib/supabase/server";
import type { PostInput } from "@/lib/types/post";

const SAVE_FAILED = "글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const DELETE_FAILED = "글을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NOT_FOUND = "수정할 글을 찾을 수 없습니다.";
const DRAFT_SAVED = "임시 저장했습니다.";
const UNIQUE_VIOLATION = "23505";

/**
 * 글 변경 후 공개 캐시를 태그로 무효화한다 (비공개 헬퍼).
 * 공개 조회 쿼리(lib/queries/posts.ts)가 posts, post:<NFC slug> 태그를 쓰므로
 * 목록과 영향받은 글 상세만 만료한다. updateTag는 다음 요청이 새 데이터를 기다려
 * 저장·삭제 직후 바로 반영된다. 관리자 경로는 캐시 태그가 없어 revalidatePath를 쓴다.
 */
function invalidatePostTags(slugs: string[]) {
  updateTag("posts");
  for (const slug of new Set(slugs)) {
    updateTag(`post:${slug.normalize("NFC")}`);
  }
  revalidatePath("/admin/posts");
}

export async function savePost(
  _prevState: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  await requireAdmin();

  const { id, values } = parsePostFormData(formData);

  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      message: "입력값을 확인해 주세요.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }
  if (id !== null && !z.uuid().safeParse(id).success) {
    return { ok: false, message: NOT_FOUND };
  }

  // 새 글 insert 직후 편집 화면으로 보내기 위한 id
  let createdId: string | null = null;
  // 무효화할 슬러그: 새 슬러그와(수정이면) 변경 전 슬러그
  const staleSlugs: string[] = [parsed.data.slug];

  try {
    // 요청마다 새 클라이언트를 만든다.
    const supabase = await createClient();

    let error: { code?: string; message: string } | null;

    if (id) {
      // 수정: 최초 발행일 유지와 이전 슬러그 무효화를 위해 기존 값을 먼저 읽는다.
      const { data: existing, error: readError } = await supabase
        .from("posts")
        .select("published_at, slug")
        .eq("id", id)
        .maybeSingle();

      if (readError) {
        console.error("[savePost:read]", readError.message);
        return { ok: false, message: SAVE_FAILED };
      }
      if (!existing) return { ok: false, message: NOT_FOUND };
      staleSlugs.push(existing.slug);

      const payload: PostInput = parsed.data;
      const { data: updated, error: updateError } = await supabase
        .from("posts")
        .update({
          ...payload,
          published_at: resolvePublishedAt(
            existing.published_at,
            payload.published,
          ),
        })
        .eq("id", id)
        .select("id")
        .maybeSingle();

      error = updateError;
      // 영향 행이 0이면(삭제 직후·RLS 거부) 성공으로 보지 않는다.
      if (!error && !updated) return { ok: false, message: NOT_FOUND };
    } else {
      const payload: PostInput = parsed.data;
      const result = await supabase
        .from("posts")
        .insert({
          ...payload,
          published_at: resolvePublishedAt(null, payload.published),
        })
        .select("id")
        .single();
      error = result.error;
      createdId = result.data?.id ?? null;
    }

    if (error) {
      if (error.code === UNIQUE_VIOLATION) {
        return {
          ok: false,
          message: "입력값을 확인해 주세요.",
          fieldErrors: { slug: ["이미 사용 중인 슬러그입니다"] },
        };
      }
      // DB 원문 메시지는 사용자에게 노출하지 않는다.
      console.error("[savePost]", error.code, error.message);
      return { ok: false, message: SAVE_FAILED };
    }
  } catch (error) {
    // 프리렌더 중단·redirect 같은 Next.js 내부 신호는 삼키지 않는다.
    unstable_rethrow(error);
    console.error("[savePost]", error);
    return { ok: false, message: SAVE_FAILED };
  }

  invalidatePostTags(staleSlugs);

  // 임시 저장(발행 아님)은 목록으로 보내지 않고 편집 화면에 머문다.
  // 새 글은 이후 저장이 중복 생성이 되지 않도록 방금 만든 글의 수정 화면으로 보낸다.
  if (!parsed.data.published) {
    // redirect는 예외를 던지므로 try/catch 밖에서 호출한다.
    if (createdId) redirect(`/admin/posts/${createdId}/edit`);
    return { ok: true, message: DRAFT_SAVED };
  }

  redirect("/admin/posts");
}

export async function deletePost(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "잘못된 글 식별자입니다." };
  }

  let deletedSlug: string;

  try {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .select("id, slug");

    if (error) {
      console.error("[deletePost]", error.code, error.message);
      return { ok: false, message: DELETE_FAILED };
    }
    // RLS 거부·이미 삭제된 경우 오류 없이 0행이 되므로 영향 행을 확인한다.
    if (deleted.length === 0) {
      return { ok: false, message: DELETE_FAILED };
    }
    // 삭제된 행에서 slug를 얻는다(삭제 전 별도 조회 불필요).
    deletedSlug = deleted[0].slug;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deletePost]", error);
    return { ok: false, message: DELETE_FAILED };
  }

  invalidatePostTags([deletedSlug]);
  return { ok: true };
}
