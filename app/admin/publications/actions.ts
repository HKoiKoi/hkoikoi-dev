"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import {
  validationFailure,
  type AdminFormState,
} from "@/lib/schemas/admin-form";
import { formString } from "@/lib/schemas/fields";
import {
  parsePublicationFormData,
  publicationSchema,
} from "@/lib/schemas/publication";
import { createClient } from "@/lib/supabase/server";

const SAVE_FAILED = "논문을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const DELETE_FAILED = "논문을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const TOGGLE_FAILED =
  "공개 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NOT_FOUND = "논문을 찾을 수 없습니다.";
const INVALID_ID = "잘못된 논문 식별자입니다.";

const FORM_KEYS = ["title", "authors", "venue", "year", "link"] as const;

type ActionResult = { ok: boolean; message?: string };

/**
 * 논문 변경 후 공개 캐시를 태그로 무효화한다(비공개 헬퍼).
 * 공개 조회(lib/queries/resume.ts의 getPublications)가 publications 태그를 쓴다.
 * 공개 화면은 연도 내림차순이라 이동 액션은 두지 않는다(같은 해의 순서는 sort_order).
 */
function invalidatePublications() {
  updateTag("publications");
  revalidatePath("/admin/publications");
}

export async function savePublication(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = formString(formData, "id");

  const parsed = publicationSchema.safeParse(
    parsePublicationFormData(formData),
  );
  if (!parsed.success) {
    return validationFailure(parsed.error, formData, FORM_KEYS);
  }
  if (id && !z.uuid().safeParse(id).success) {
    return { ok: false, message: NOT_FOUND };
  }

  try {
    const supabase = await createClient();

    if (id) {
      const { data, error } = await supabase
        .from("publications")
        .update(parsed.data)
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[savePublication]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      // 영향 행이 0이면(삭제 직후·RLS 거부) 성공으로 보지 않는다.
      if (!data) return { ok: false, message: NOT_FOUND };
    } else {
      // 새 논문은 마지막(숨김 포함 max sort_order + 10)에 붙인다. 같은 해 안의 순서 기준이다.
      const { data: last, error: readError } = await supabase
        .from("publications")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (readError) {
        console.error("[savePublication:read]", readError.message);
        return { ok: false, message: SAVE_FAILED };
      }
      const { data, error } = await supabase
        .from("publications")
        .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 10 })
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[savePublication]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      if (!data) return { ok: false, message: SAVE_FAILED };
    }
  } catch (error) {
    // 프리렌더 중단·redirect 같은 Next.js 내부 신호는 삼키지 않는다.
    unstable_rethrow(error);
    console.error("[savePublication]", error);
    return { ok: false, message: SAVE_FAILED };
  }

  invalidatePublications();
  redirect("/admin/publications");
}

export async function deletePublication(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: INVALID_ID };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("publications")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      console.error("[deletePublication]", error.code, error.message);
      return { ok: false, message: DELETE_FAILED };
    }
    // RLS 거부·이미 삭제된 경우 오류 없이 0행이 되므로 영향 행을 확인한다.
    if (data.length === 0) return { ok: false, message: DELETE_FAILED };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deletePublication]", error);
    return { ok: false, message: DELETE_FAILED };
  }

  invalidatePublications();
  return { ok: true };
}

export async function togglePublicationVisibility(
  id: string,
  visible: boolean,
): Promise<ActionResult> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: INVALID_ID };
  }
  if (typeof visible !== "boolean") {
    return { ok: false, message: TOGGLE_FAILED };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("publications")
      .update({ is_visible: visible })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[togglePublicationVisibility]", error.code, error.message);
      return { ok: false, message: TOGGLE_FAILED };
    }
    if (!data) return { ok: false, message: NOT_FOUND };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[togglePublicationVisibility]", error);
    return { ok: false, message: TOGGLE_FAILED };
  }

  invalidatePublications();
  return { ok: true };
}
