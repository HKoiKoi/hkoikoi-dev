"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { moveInList, type MoveDirection } from "@/lib/admin/reorder";
import {
  validationFailure,
  type AdminFormState,
} from "@/lib/schemas/admin-form";
import { formString } from "@/lib/schemas/fields";
import { parseResumeFormData, resumeEntrySchema } from "@/lib/schemas/resume";
import { createClient } from "@/lib/supabase/server";
import { RESUME_SECTIONS, type ResumeSection } from "@/lib/types/resume";

const SAVE_FAILED = "항목을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const DELETE_FAILED = "항목을 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const TOGGLE_FAILED =
  "공개 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
const MOVE_FAILED = "순서를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NOT_FOUND = "항목을 찾을 수 없습니다.";
const INVALID_ID = "잘못된 항목 식별자입니다.";

const FORM_KEYS = [
  "title",
  "subtitle",
  "period",
  "description",
  "grade",
  "grade_label",
  "tags",
  "tag_groups",
  "link",
] as const;

type ActionResult = { ok: boolean; message?: string };

function isResumeSection(value: string): value is ResumeSection {
  return (RESUME_SECTIONS as readonly string[]).includes(value);
}

/**
 * 이력 변경 후 공개 캐시를 태그로 무효화한다(비공개 헬퍼).
 * 공개 조회(lib/queries/resume.ts)가 resume, resume:<section> 태그를 쓴다.
 * 관리자 경로는 캐시 태그가 없어 revalidatePath를 쓴다.
 */
function invalidateResume(section: string) {
  updateTag("resume");
  updateTag(`resume:${section}`);
  revalidatePath(`/admin/resume/${section}`);
}

export async function saveResumeEntry(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = formString(formData, "id");
  const section = formString(formData, "section");
  if (!isResumeSection(section)) return { ok: false, message: NOT_FOUND };

  const parsed = resumeEntrySchema.safeParse(parseResumeFormData(formData));
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
        .from("resume_entries")
        .update(parsed.data)
        .eq("id", id)
        .eq("section", section)
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[saveResumeEntry]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      // 영향 행이 0이면(삭제 직후·RLS 거부·다른 섹션) 성공으로 보지 않는다.
      if (!data) return { ok: false, message: NOT_FOUND };
    } else {
      // 새 항목은 섹션의 마지막(숨김 포함 max sort_order + 10)에 붙인다.
      const { data: last, error: readError } = await supabase
        .from("resume_entries")
        .select("sort_order")
        .eq("section", section)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (readError) {
        console.error("[saveResumeEntry:read]", readError.message);
        return { ok: false, message: SAVE_FAILED };
      }
      const { data, error } = await supabase
        .from("resume_entries")
        .insert({
          ...parsed.data,
          section,
          sort_order: (last?.sort_order ?? 0) + 10,
        })
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[saveResumeEntry]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      if (!data) return { ok: false, message: SAVE_FAILED };
    }
  } catch (error) {
    // 프리렌더 중단·redirect 같은 Next.js 내부 신호는 삼키지 않는다.
    unstable_rethrow(error);
    console.error("[saveResumeEntry]", error);
    return { ok: false, message: SAVE_FAILED };
  }

  invalidateResume(section);
  redirect(`/admin/resume/${section}`);
}

export async function deleteResumeEntry(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: INVALID_ID };
  }

  let section: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resume_entries")
      .delete()
      .eq("id", id)
      .select("id, section");
    if (error) {
      console.error("[deleteResumeEntry]", error.code, error.message);
      return { ok: false, message: DELETE_FAILED };
    }
    // RLS 거부·이미 삭제된 경우 오류 없이 0행이 되므로 영향 행을 확인한다.
    if (data.length === 0) return { ok: false, message: DELETE_FAILED };
    section = data[0].section;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deleteResumeEntry]", error);
    return { ok: false, message: DELETE_FAILED };
  }

  invalidateResume(section);
  return { ok: true };
}

export async function toggleResumeVisibility(
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

  let section: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("resume_entries")
      .update({ is_visible: visible })
      .eq("id", id)
      .select("id, section")
      .maybeSingle();
    if (error) {
      console.error("[toggleResumeVisibility]", error.code, error.message);
      return { ok: false, message: TOGGLE_FAILED };
    }
    if (!data) return { ok: false, message: NOT_FOUND };
    section = data.section;
  } catch (error) {
    unstable_rethrow(error);
    console.error("[toggleResumeVisibility]", error);
    return { ok: false, message: TOGGLE_FAILED };
  }

  invalidateResume(section);
  return { ok: true };
}

/**
 * 항목을 같은 섹션 안에서 한 칸 위/아래로 옮긴다.
 * 섹션 전체의 현재 순서(숨김 포함, 관리자 목록과 같은 정렬)를 읽어 이웃과 바꾼 뒤
 * reorder_resume_entries RPC가 한 번에 재배치한다(중간 상태 노출 없음).
 */
export async function moveResumeEntry(
  id: string,
  direction: MoveDirection,
): Promise<ActionResult> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: INVALID_ID };
  }
  if (direction !== "up" && direction !== "down") {
    return { ok: false, message: MOVE_FAILED };
  }

  let section: string;
  try {
    const supabase = await createClient();

    const { data: entry, error: entryError } = await supabase
      .from("resume_entries")
      .select("section")
      .eq("id", id)
      .maybeSingle();
    if (entryError) {
      console.error("[moveResumeEntry:read]", entryError.message);
      return { ok: false, message: MOVE_FAILED };
    }
    if (!entry) return { ok: false, message: NOT_FOUND };
    section = entry.section;

    const { data: rows, error: listError } = await supabase
      .from("resume_entries")
      .select("id")
      .eq("section", section)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (listError) {
      console.error("[moveResumeEntry:list]", listError.message);
      return { ok: false, message: MOVE_FAILED };
    }

    const next = moveInList(
      (rows ?? []).map((row) => row.id),
      id,
      direction,
    );
    // 맨 앞/맨 뒤에서는 옮길 곳이 없다(버튼은 비활성화돼 있어 동시 변경으로만 도달).
    if (!next) return { ok: true };

    const { error } = await supabase.rpc("reorder_resume_entries", {
      p_section: section,
      p_ids: next,
    });
    if (error) {
      console.error("[moveResumeEntry]", error.code, error.message);
      return { ok: false, message: MOVE_FAILED };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[moveResumeEntry]", error);
    return { ok: false, message: MOVE_FAILED };
  }

  invalidateResume(section);
  return { ok: true };
}
