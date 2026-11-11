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
import { parseProjectFormData, projectSchema } from "@/lib/schemas/project";
import { createClient } from "@/lib/supabase/server";

const SAVE_FAILED =
  "프로젝트를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const DELETE_FAILED =
  "프로젝트를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.";
const TOGGLE_FAILED =
  "공개 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
const MOVE_FAILED = "순서를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
const NOT_FOUND = "프로젝트를 찾을 수 없습니다.";
const INVALID_ID = "잘못된 프로젝트 식별자입니다.";

const FORM_KEYS = [
  "name",
  "summary",
  "period",
  "role",
  "stack",
  "github_url",
  "demo_url",
  "featured",
] as const;

type ActionResult = { ok: boolean; message?: string };

/**
 * 프로젝트 변경 후 공개 캐시를 태그로 무효화한다(비공개 헬퍼).
 * 공개 조회(lib/queries/resume.ts의 getProjects)가 projects 태그를 쓰며, 홈 대표 프로젝트도 같은 태그다.
 */
function invalidateProjects() {
  updateTag("projects");
  revalidatePath("/admin/projects");
}

export async function saveProject(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  await requireAdmin();

  const id = formString(formData, "id");

  const parsed = projectSchema.safeParse(parseProjectFormData(formData));
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
        .from("projects")
        .update(parsed.data)
        .eq("id", id)
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[saveProject]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      // 영향 행이 0이면(삭제 직후·RLS 거부) 성공으로 보지 않는다.
      if (!data) return { ok: false, message: NOT_FOUND };
    } else {
      // 새 프로젝트는 마지막(숨김 포함 max sort_order + 10)에 붙인다.
      const { data: last, error: readError } = await supabase
        .from("projects")
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (readError) {
        console.error("[saveProject:read]", readError.message);
        return { ok: false, message: SAVE_FAILED };
      }
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...parsed.data, sort_order: (last?.sort_order ?? 0) + 10 })
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("[saveProject]", error.code, error.message);
        return { ok: false, message: SAVE_FAILED };
      }
      if (!data) return { ok: false, message: SAVE_FAILED };
    }
  } catch (error) {
    // 프리렌더 중단·redirect 같은 Next.js 내부 신호는 삼키지 않는다.
    unstable_rethrow(error);
    console.error("[saveProject]", error);
    return { ok: false, message: SAVE_FAILED };
  }

  invalidateProjects();
  redirect("/admin/projects");
}

export async function deleteProject(id: string): Promise<ActionResult> {
  await requireAdmin();

  if (!z.uuid().safeParse(id).success) {
    return { ok: false, message: INVALID_ID };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .select("id");
    if (error) {
      console.error("[deleteProject]", error.code, error.message);
      return { ok: false, message: DELETE_FAILED };
    }
    // RLS 거부·이미 삭제된 경우 오류 없이 0행이 되므로 영향 행을 확인한다.
    if (data.length === 0) return { ok: false, message: DELETE_FAILED };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[deleteProject]", error);
    return { ok: false, message: DELETE_FAILED };
  }

  invalidateProjects();
  return { ok: true };
}

export async function toggleProjectVisibility(
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
      .from("projects")
      .update({ is_visible: visible })
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("[toggleProjectVisibility]", error.code, error.message);
      return { ok: false, message: TOGGLE_FAILED };
    }
    if (!data) return { ok: false, message: NOT_FOUND };
  } catch (error) {
    unstable_rethrow(error);
    console.error("[toggleProjectVisibility]", error);
    return { ok: false, message: TOGGLE_FAILED };
  }

  invalidateProjects();
  return { ok: true };
}

/**
 * 프로젝트를 한 칸 위/아래로 옮긴다. 전체 현재 순서(숨김 포함, 관리자 목록과 같은 정렬)를 읽어
 * 이웃과 바꾼 뒤 reorder_projects RPC가 한 번에 재배치한다.
 */
export async function moveProject(
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

  try {
    const supabase = await createClient();

    const { data: rows, error: listError } = await supabase
      .from("projects")
      .select("id")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });
    if (listError) {
      console.error("[moveProject:list]", listError.message);
      return { ok: false, message: MOVE_FAILED };
    }

    const ids = (rows ?? []).map((row) => row.id);
    if (!ids.includes(id)) return { ok: false, message: NOT_FOUND };

    const next = moveInList(ids, id, direction);
    // 맨 앞/맨 뒤에서는 옮길 곳이 없다(버튼은 비활성화돼 있어 동시 변경으로만 도달).
    if (!next) return { ok: true };

    const { error } = await supabase.rpc("reorder_projects", { p_ids: next });
    if (error) {
      console.error("[moveProject]", error.code, error.message);
      return { ok: false, message: MOVE_FAILED };
    }
  } catch (error) {
    unstable_rethrow(error);
    console.error("[moveProject]", error);
    return { ok: false, message: MOVE_FAILED };
  }

  invalidateProjects();
  return { ok: true };
}
