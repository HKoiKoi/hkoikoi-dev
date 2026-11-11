"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { autosaveDraft, savePost } from "@/app/admin/posts/actions";
import { AutosaveStatus } from "@/app/admin/posts/_components/autosave-status";
import { FieldError } from "@/app/admin/_components/field-error";
import { ImageUploadButton } from "@/app/admin/posts/_components/image-upload-button";
import { MarkdownPreview } from "@/app/admin/posts/_components/markdown-preview";
import { PostMetaFields } from "@/app/admin/posts/_components/post-meta-fields";
import { RestoreBanner } from "@/app/admin/posts/_components/restore-banner";
import { ThumbnailField } from "@/app/admin/posts/_components/thumbnail-field";
import {
  useAutosave,
  type AutosaveServerResult,
} from "@/app/admin/posts/_components/use-autosave";
import { useContentUpload } from "@/app/admin/posts/_components/use-content-upload";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  clearDraft,
  draftKey,
  readDraft,
  type PostDraft,
} from "@/lib/editor/draft-storage";
import { parseTags, type PostActionState } from "@/lib/schemas/post";
import type { Post } from "@/lib/types/post";
import { cn } from "@/lib/utils";

const initialState: PostActionState = { ok: false };

interface PostEditorProps {
  /** 수정 모드일 때 불러온 글. 없으면 새 글 작성 모드. */
  initialPost?: Post;
}

// localStorage는 구독할 이벤트가 없어도 되는 값(마운트 뒤 한 번 읽기)이라 구독은 비워 둔다.
function subscribeNoop() {
  return () => {};
}

function readRawDraft(id: string | null): string | null {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
}

/** 복원할 만한 로컬 사본인지: 서버 값보다 새롭고 내용이 서버 값과 다를 때만 */
function isRestorable(draft: PostDraft, initialPost?: Post): boolean {
  if (initialPost && draft.savedAt <= Date.parse(initialPost.updated_at)) {
    return false;
  }
  const server = {
    title: initialPost?.title ?? "",
    slug: initialPost?.slug ?? "",
    category: initialPost?.category ?? "일반",
    tags: initialPost?.tags.join(", ") ?? "",
    excerpt: initialPost?.excerpt ?? "",
    content: initialPost?.content ?? "",
    thumbnailUrl: initialPost?.thumbnail_url ?? "",
  };
  return (Object.keys(server) as (keyof typeof server)[]).some(
    (key) => draft[key] !== server[key],
  );
}

/** 로컬 사본 값을 initialPost 모양으로 합쳐 기존 입력 컴포넌트에 그대로 넘긴다. */
function mergeDraft(initialPost: Post | undefined, draft: PostDraft): Post {
  // 새 글은 id·시각이 없으므로 빈 값으로 채운다. 입력 컴포넌트는 값 필드만 읽는다.
  const base =
    initialPost ??
    ({
      id: "",
      published: false,
      published_at: null,
      created_at: "",
      updated_at: "",
    } as unknown as Post);
  return {
    ...base,
    title: draft.title,
    slug: draft.slug,
    category: draft.category,
    tags: parseTags(draft.tags),
    excerpt: draft.excerpt,
    content: draft.content,
    thumbnail_url: draft.thumbnailUrl || null,
  };
}

function readSnapshot(
  form: HTMLFormElement | null,
  baseUpdatedAt: string | null,
): PostDraft | null {
  if (!form) return null;
  // savePost와 같은 직렬화: 폼 name 그대로 읽는다.
  const data = new FormData(form);
  const text = (key: string) => {
    const value = data.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    title: text("title"),
    slug: text("slug"),
    category: text("category"),
    tags: text("tags"),
    excerpt: text("excerpt"),
    content: text("content"),
    thumbnailUrl: text("thumbnail_url"),
    savedAt: Date.now(),
    baseUpdatedAt,
  };
}

function toFormData(snapshot: PostDraft): FormData {
  const data = new FormData();
  data.set("title", snapshot.title);
  data.set("slug", snapshot.slug);
  data.set("category", snapshot.category);
  data.set("tags", snapshot.tags);
  data.set("excerpt", snapshot.excerpt);
  data.set("content", snapshot.content);
  data.set("thumbnail_url", snapshot.thumbnailUrl);
  return data;
}

// 복원 배너와 폼 재마운트만 맡고, 편집 상태는 PostEditorForm이 가진다.
export function PostEditor({ initialPost }: PostEditorProps) {
  const storageId = initialPost?.id ?? null;
  // 서버 렌더에서는 null, 하이드레이션 뒤 클라이언트에서 localStorage 값을 읽는다.
  const rawDraft = useSyncExternalStore(
    subscribeNoop,
    () => readRawDraft(storageId),
    () => null,
  );
  const [decided, setDecided] = useState(false);
  const [restored, setRestored] = useState<PostDraft | null>(null);
  const [formVersion, setFormVersion] = useState(0);

  const candidate = useMemo(() => {
    if (decided || !rawDraft) return null;
    const draft = readDraft(storageId);
    return draft && isRestorable(draft, initialPost) ? draft : null;
  }, [decided, rawDraft, storageId, initialPost]);

  const seed = useMemo(
    () => (restored ? mergeDraft(initialPost, restored) : initialPost),
    [restored, initialPost],
  );

  function handleRestore() {
    if (!candidate) return;
    setRestored(candidate);
    setFormVersion((version) => version + 1);
    setDecided(true);
  }

  function handleDiscard() {
    clearDraft(storageId);
    setDecided(true);
  }

  return (
    <div className="grid gap-4">
      {candidate && (
        <RestoreBanner onRestore={handleRestore} onDiscard={handleDiscard} />
      )}
      <PostEditorForm
        key={formVersion}
        initialPost={initialPost}
        seed={seed}
        // 복원한 사본은 편집 시작 시점의 updated_at을 기준으로 해야 서버가 더 새로우면 충돌로 드러난다.
        initialBaseUpdatedAt={
          restored?.baseUpdatedAt ?? initialPost?.updated_at ?? null
        }
        initiallyDirty={restored !== null}
        // 복원 여부를 정하기 전에는 자동 저장이 로컬 사본을 덮어쓰지 않게 멈춘다.
        autosaveEnabled={candidate === null}
      />
    </div>
  );
}

interface PostEditorFormProps {
  /** 서버에 있는 글. id·발행 여부 판단에 쓴다. 새 글이면 없음. */
  initialPost?: Post;
  /** 입력 초기값. 복원하면 로컬 사본이 합쳐진 값이다. */
  seed?: Post;
  initialBaseUpdatedAt: string | null;
  initiallyDirty: boolean;
  autosaveEnabled: boolean;
}

function PostEditorForm({
  initialPost,
  seed,
  initialBaseUpdatedAt,
  initiallyDirty,
  autosaveEnabled,
}: PostEditorFormProps) {
  const [state, formAction, isPending] = useActionState(savePost, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  // 어느 버튼으로 제출했는지 저장 중 문구에만 사용한다. 발행 여부는 제출 버튼의 name/value로 전송된다.
  const [submitKind, setSubmitKind] = useState<"draft" | "publish">("draft");
  const {
    content,
    textareaRef,
    uploadingCount,
    uploadErrors,
    updateContent,
    uploadFiles,
    handlePaste,
    handleDrop,
    handleDragOver,
  } = useContentUpload(seed?.content ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(seed?.thumbnail_url ?? "");
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  // 모바일(lg 미만) 전용 탭 선택값. 두 패널은 항상 마운트되고 CSS로만 숨겨 입력값이 유지된다.
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  const formRef = useRef<HTMLFormElement>(null);
  // 오류 후 모바일 미리보기 탭에서 작성 탭으로 돌아온 다음 포커스를 옮기기 위한 표시.
  const pendingFocusRef = useRef(false);

  // 저장 버튼은 처리 중 disabled가 되어 포커스를 잃으므로, 서버 검증이 실패하면 첫 오류 입력으로 옮긴다.
  useEffect(() => {
    if (Object.keys(state.fieldErrors ?? {}).length === 0) return;
    pendingFocusRef.current = true;
    // 미리보기 탭에서는 입력이 display:none이라 포커스할 수 없으므로 작성 탭으로 되돌린다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileTab("write");
  }, [state]);

  useEffect(() => {
    if (!pendingFocusRef.current || mobileTab !== "write") return;
    pendingFocusRef.current = false;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [state, mobileTab]);

  const isEdit = Boolean(initialPost);
  const isUploading = uploadingCount > 0 || thumbnailBusy;

  // 자동 저장 기준 시각. 서버 저장 성공·수동 저장 성공 때마다 최신 값으로 바꾼다.
  const baseUpdatedAtRef = useRef(initialBaseUpdatedAt);
  // 서버 자동 저장은 id가 있는 초안만 허용한다. 새 글·발행 글은 로컬 백업만 한다(서버 측에서도 거절).
  const canSaveToServer = initialPost !== undefined && !initialPost.published;

  async function saveToServer(
    snapshot: PostDraft,
  ): Promise<AutosaveServerResult> {
    if (!initialPost) {
      return { ok: false, reason: "failed", message: "저장할 글이 없습니다." };
    }
    const result = await autosaveDraft(
      initialPost.id,
      toFormData(snapshot),
      baseUpdatedAtRef.current ?? "",
    );
    if (result.ok) baseUpdatedAtRef.current = result.updatedAt;
    return result;
  }

  const { status, savedAt, notifyChange } = useAutosave({
    getSnapshot: () => readSnapshot(formRef.current, baseUpdatedAtRef.current),
    enabled: autosaveEnabled,
    // 업로드 중에는 자리표시 텍스트가 저장되지 않게, 수동 저장 중에는 요청이 겹치지 않게 보류한다.
    blocked: isUploading || isPending,
    canSaveToServer,
    saveToServer,
    storageId: initialPost?.id ?? null,
  });

  // 저장하지 않은 변경 여부(이탈 경고용). 로컬 백업만 된 경우에도 서버에는 없으므로 true로 둔다.
  const [dirty, setDirty] = useState(initiallyDirty);
  function markChanged() {
    setDirty(true);
    notifyChange();
  }

  // 렌더 중 이전 값과 비교해 상태를 조정한다(effect 안 setState를 피한다).
  const [prevContent, setPrevContent] = useState(content);
  if (content !== prevContent) {
    setPrevContent(content);
    setDirty(true);
  }
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "saved") setDirty(false);
  }
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (state.ok) setDirty(false);
  }

  // 이미지 업로드 결과 치환처럼 폼 이벤트 없이 본문이 바뀌는 경우와, 복원 직후의 첫 저장을 예약한다.
  const seenContentRef = useRef(content);
  useEffect(() => {
    if (seenContentRef.current === content) return;
    seenContentRef.current = content;
    notifyChange();
  }, [content, notifyChange]);
  useEffect(() => {
    if (initiallyDirty) notifyChange();
    // 마운트 때 한 번만 실행한다(복원은 key를 바꿔 다시 마운트한다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 수동 저장 성공 시 로컬 사본을 지우고 잠금 기준을 갱신한다.
  const storageId = initialPost?.id ?? null;
  useEffect(() => {
    if (!state.ok) return;
    clearDraft(storageId);
    if (state.updatedAt) baseUpdatedAtRef.current = state.updatedAt;
  }, [state, storageId]);

  // 제출이 redirect로 끝나면(새 글 생성·발행) 이 컴포넌트가 사라지므로 그때 로컬 사본을 정리한다.
  const submittedRef = useRef(false);
  useEffect(() => {
    if (state !== initialState) submittedRef.current = false;
  }, [state]);
  useEffect(
    () => () => {
      if (submittedRef.current) clearDraft(storageId);
    },
    [storageId],
  );

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // 수동 저장 안내가 있으면 그것을, 아니면 자동 저장 상태를 보여 같은 자리에서 겹치지 않게 한다.
  const showManualMessage = Boolean(state.message) && (!state.ok || !dirty);

  return (
    <div className="grid gap-4 pb-20">
      <Tabs
        value={mobileTab}
        onValueChange={(value) => setMobileTab(value as "write" | "preview")}
        className="lg:hidden"
      >
        <TabsList className="w-full">
          <TabsTrigger value="write">작성</TabsTrigger>
          <TabsTrigger value="preview">미리보기</TabsTrigger>
        </TabsList>
      </Tabs>

      <form
        ref={formRef}
        className="grid gap-6"
        action={formAction}
        noValidate
        onChange={markChanged}
        onSubmit={() => {
          submittedRef.current = true;
        }}
      >
        {initialPost && (
          <input type="hidden" name="id" value={initialPost.id} />
        )}
        {/* 메타데이터 필드. 모바일에서는 미리보기 탭일 때만 숨긴다. */}
        <PostMetaFields
          initialPost={seed}
          fieldErrors={fieldErrors}
          className={cn(
            "gap-6",
            mobileTab === "write" ? "grid" : "hidden lg:grid",
          )}
        >
          <ThumbnailField
            value={thumbnailUrl}
            onChange={(url) => {
              setThumbnailUrl(url);
              markChanged();
            }}
            error={fieldErrors.thumbnail_url?.[0]}
            onBusyChange={setThumbnailBusy}
          />
        </PostMetaFields>

        {/* 본문 입력과 미리보기를 나란히 둔다. 모바일에서는 탭으로 전환한다. */}
        <div className="grid gap-4 lg:h-[70vh] lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <div
            className={cn(
              "gap-2 lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]",
              mobileTab === "write" ? "grid" : "hidden lg:grid",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="post-content">본문</Label>
              <ImageUploadButton onFiles={uploadFiles} />
            </div>
            <Textarea
              ref={textareaRef}
              id="post-content"
              name="content"
              aria-invalid={!!fieldErrors.content}
              aria-describedby={
                fieldErrors.content ? "post-content-error" : undefined
              }
              value={content}
              onChange={(event) => updateContent(() => event.target.value)}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder="마크다운으로 본문을 작성하세요"
              className="min-h-96 font-mono lg:h-full"
            />
            <div aria-live="polite" className="text-xs text-muted-foreground">
              {uploadingCount > 0 && `이미지 업로드 중… (${uploadingCount})`}
            </div>
            {uploadErrors.length > 0 && (
              <ul role="alert" className="grid gap-1 text-sm text-destructive">
                {uploadErrors.map((message, index) => (
                  <li key={index}>{message}</li>
                ))}
              </ul>
            )}
            <FieldError id="post-content-error" errors={fieldErrors.content} />
          </div>

          {/* 본문은 Shadow DOM으로 격리해 렌더링하므로 본문 <style>이 편집기 UI에 영향을 주지 않는다. */}
          <section
            aria-label="미리보기"
            className={cn(
              "min-w-0 gap-2 lg:grid lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)]",
              mobileTab === "preview" ? "grid grid-rows-[auto_1fr]" : "hidden",
            )}
          >
            {/* 본문 Label과 같은 높이로 맞춰 두 입력 영역의 상단선을 정렬한다. */}
            <h2 className="text-sm leading-none font-medium">미리보기</h2>
            {/* 데스크톱에서는 입력 영역과 같은 높이로 고정하고 미리보기만 세로 스크롤한다. */}
            <div className="min-h-96 min-w-0 overflow-x-hidden rounded-lg border bg-card text-card-foreground lg:min-h-0 lg:overflow-y-auto">
              <MarkdownPreview content={content} />
            </div>
          </section>
        </div>

        {/* 하단 고정 바: 긴 본문을 스크롤해도 나가기·저장 버튼이 항상 보인다. */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background">
          <div className="mx-auto flex min-h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link
              href="/admin/posts"
              className={buttonVariants({ variant: "outline" })}
              onClick={(event) => {
                if (
                  dirty &&
                  !window.confirm(
                    "저장하지 않은 변경이 있습니다. 나가시겠습니까?",
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <ArrowLeftIcon aria-hidden="true" />
              나가기
            </Link>
            <div className="min-w-0 flex-1 text-right">
              {showManualMessage ? (
                <p
                  role={state.ok ? "status" : "alert"}
                  className={cn(
                    "text-sm",
                    state.ok ? "text-muted-foreground" : "text-destructive",
                  )}
                >
                  {state.message}
                </p>
              ) : (
                status !== "idle" && (
                  <AutosaveStatus status={status} savedAt={savedAt} />
                )
              )}
            </div>
            <div className="flex gap-2">
              {/* 발행 값을 보내지 않으므로 초안으로 저장된다. */}
              <Button
                type="submit"
                variant="outline"
                disabled={isPending || isUploading}
                onClick={() => setSubmitKind("draft")}
              >
                {isPending && submitKind === "draft" ? "저장 중…" : "임시 저장"}
              </Button>
              {/* 체크 시와 같은 published=on을 보내 발행 상태로 저장한다. */}
              <Button
                type="submit"
                name="published"
                value="on"
                disabled={isPending || isUploading}
                onClick={() => setSubmitKind("publish")}
              >
                {isPending && submitKind === "publish"
                  ? "저장 중…"
                  : isEdit
                    ? "수정하기"
                    : "발행하기"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
