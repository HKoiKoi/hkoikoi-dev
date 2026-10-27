"use server";

import { revalidatePath } from "next/cache";
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
const UNIQUE_VIOLATION = "23505";

/**
 * 글 변경 후 영향을 받는 경로를 무효화한다 (비공개 헬퍼).
 * 공개 조회 쿼리는 'use cache'를 쓰지 않아 cacheTag 소비자가 없으므로
 * updateTag/revalidateTag 대신 경로 단위 revalidatePath를 쓴다.
 */
function revalidatePostPaths() {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
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

  try {
    // 요청마다 새 클라이언트를 만든다.
    const supabase = await createClient();

    let error: { code?: string; message: string } | null;

    if (id) {
      // 수정: 최초 발행일 유지를 위해 기존 published_at을 먼저 읽는다.
      const { data: existing, error: readError } = await supabase
        .from("posts")
        .select("published_at")
        .eq("id", id)
        .maybeSingle();

      if (readError) {
        console.error("[savePost:read]", readError.message);
        return { ok: false, message: SAVE_FAILED };
      }
      if (!existing) return { ok: false, message: NOT_FOUND };

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
      const result = await supabase.from("posts").insert({
        ...payload,
        published_at: resolvePublishedAt(null, payload.published),
      });
      error = result.error;
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

  // redirect는 예외를 던지므로 try/catch 밖에서 호출한다.
  revalidatePostPaths();
  redirect("/admin/posts");
}

export async function deletePost(
  id: string,
): Promise<{ ok: boolean; message?: string }> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: "잘못된 글 식별자입니다." };
  }

  try {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) {
      console.error("[deletePost]", error.code, error.message);
      return { ok: false, message: DELETE_FAILED };
    }
    // RLS 거부·이미 삭제된 경우 오류 없이 0행이 되므로 영향 행을 확인한다.
    if (deleted.length === 0) {
      return { ok: false, message: DELETE_FAILED };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deletePost]", error);
    return { ok: false, message: DELETE_FAILED };
  }

  revalidatePostPaths();
  return { ok: true };
}
