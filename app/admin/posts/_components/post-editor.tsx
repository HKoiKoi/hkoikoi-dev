"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import {
  useActionState,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { savePost } from "@/app/admin/posts/actions";
import { ImageUploadButton } from "@/app/admin/posts/_components/image-upload-button";
import { ThumbnailField } from "@/app/admin/posts/_components/thumbnail-field";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "@/app/admin/posts/_components/markdown-preview";
import {
  createUploadPlaceholder,
  insertAtCursor,
  replaceOnce,
} from "@/lib/editor/insert-at-cursor";
import { slugify } from "@/lib/posts/slugify";
import {
  parseTags,
  POST_LIMITS,
  type PostActionState,
} from "@/lib/schemas/post";
import { uploadImage } from "@/lib/storage/upload-image";
import { validateImage } from "@/lib/storage/validate-image";
import type { Post } from "@/lib/types/post";
import { cn } from "@/lib/utils";

const EXCERPT_MAX = POST_LIMITS.excerpt;
const TAGS_MAX = POST_LIMITS.tags;
// 공개 글 상세 라우트(app/(site)/blog/[slug])와 같다. 편집기에서는 수정할 수 없다.
const POST_PATH_PREFIX = "/blog/";

const initialState: PostActionState = { ok: false };

interface PostEditorProps {
  /** 수정 모드일 때 불러온 글. 없으면 새 글 작성 모드. */
  initialPost?: Post;
}

interface FieldErrorProps {
  id: string;
  errors?: string[];
}

// 마크다운 이미지 alt: 확장자를 뺀 파일명, 대괄호는 제거한다.
function toAltText(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
}

function pickImageFiles(files: FileList): File[] {
  return Array.from(files).filter((file) => file.type.startsWith("image/"));
}

// 필드별 서버 검증 오류 (입력의 aria-describedby와 id로 연결)
function FieldError({ id, errors }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}

export function PostEditor({ initialPost }: PostEditorProps) {
  const [state, formAction, isPending] = useActionState(savePost, initialState);
  const fieldErrors = state.fieldErrors ?? {};

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  // 사용자가 슬러그를 직접 수정하면 제목 기반 자동 제안을 멈춘다. 수정 모드에서는 처음부터 끈다.
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost));
  const [category, setCategory] = useState(initialPost?.category ?? "일반");
  const [tagInput, setTagInput] = useState(initialPost?.tags.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  // 어느 버튼으로 제출했는지 저장 중 문구에만 사용한다. 발행 여부는 제출 버튼의 name/value로 전송된다.
  const [submitKind, setSubmitKind] = useState<"draft" | "publish">("draft");
  // 본문은 편집기가 보유한다. 미리보기(MarkdownPreview)가 같은 값을 사용한다.
  const [content, setContent] = useState(initialPost?.content ?? "");
  const contentRef = useRef(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialPost?.thumbnail_url ?? "",
  );
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  // 모바일(lg 미만) 전용 탭 선택값. 두 패널은 항상 마운트되고 CSS로만 숨겨 입력값이 유지된다.
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  const isEdit = Boolean(initialPost);
  const allTags = parseTags(tagInput);
  const tags = allTags.slice(0, TAGS_MAX);
  const tagsOverflow = allTags.length > TAGS_MAX;
  const excerptOver = excerpt.length > EXCERPT_MAX;
  const isUploading = uploadingCount > 0 || thumbnailBusy;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  // 비동기 업로드 중에도 최신 본문을 기준으로 치환하기 위해 ref로 동기화한다.
  function updateContent(update: (prev: string) => string) {
    contentRef.current = update(contentRef.current);
    setContent(contentRef.current);
  }

  function addUploadError(message: string) {
    setUploadErrors((prev) => [...prev, message]);
  }

  // 파일을 순차 업로드한다. 각 파일은 시작 시점의 선택 영역에 자리표시를 넣고 결과로 치환한다.
  async function uploadFiles(files: File[]) {
    setUploadErrors([]);
    for (const file of files) {
      const validationError = validateImage(file);
      if (validationError) {
        addUploadError(`${file.name}: ${validationError}`);
        continue;
      }

      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? contentRef.current.length;
      const end = textarea?.selectionEnd ?? contentRef.current.length;
      const placeholder = createUploadPlaceholder(crypto.randomUUID());
      const inserted = insertAtCursor(
        contentRef.current,
        start,
        end,
        placeholder,
      );
      updateContent(() => inserted.value);
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(
          inserted.cursor,
          inserted.cursor,
        );
      });

      setUploadingCount((count) => count + 1);
      try {
        const url = await uploadImage(file);
        updateContent((prev) =>
          replaceOnce(prev, placeholder, `![${toAltText(file.name)}](${url})`),
        );
      } catch {
        updateContent((prev) => replaceOnce(prev, placeholder, ""));
        addUploadError(`${file.name}: 이미지 업로드에 실패했습니다.`);
      } finally {
        setUploadingCount((count) => count - 1);
      }
    }
  }

  // 이미지 파일이 있을 때만 가로채고, 일반 텍스트 붙여넣기·드롭은 기본 동작을 유지한다.
  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const files = pickImageFiles(event.clipboardData.files);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  function handleDrop(event: DragEvent<HTMLTextAreaElement>) {
    const files = pickImageFiles(event.dataTransfer.files);
    if (files.length === 0) return;
    event.preventDefault();
    void uploadFiles(files);
  }

  function handleDragOver(event: DragEvent<HTMLTextAreaElement>) {
    if (Array.from(event.dataTransfer.types).includes("Files")) {
      event.preventDefault();
    }
  }

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

      <form className="grid gap-6" action={formAction} noValidate>
        {initialPost && (
          <input type="hidden" name="id" value={initialPost.id} />
        )}
        {/* 메타데이터 필드. 모바일에서는 미리보기 탭일 때만 숨긴다. */}
        <div
          className={cn(
            "gap-6",
            mobileTab === "write" ? "grid" : "hidden lg:grid",
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="post-title">제목</Label>
            <Input
              id="post-title"
              name="title"
              aria-invalid={!!fieldErrors.title}
              aria-describedby={
                fieldErrors.title ? "post-title-error" : undefined
              }
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="글 제목"
            />
            <FieldError id="post-title-error" errors={fieldErrors.title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-slug">URL</Label>
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground select-none">
                {POST_PATH_PREFIX}
              </span>
              <Input
                id="post-slug"
                name="slug"
                aria-invalid={!!fieldErrors.slug}
                aria-describedby={
                  fieldErrors.slug ? "post-slug-error" : undefined
                }
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="제목 입력 시 자동 제안"
                className="rounded-l-none"
              />
            </div>
            <FieldError id="post-slug-error" errors={fieldErrors.slug} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-category">카테고리</Label>
            <Input
              id="post-category"
              name="category"
              aria-invalid={!!fieldErrors.category}
              aria-describedby={
                fieldErrors.category ? "post-category-error" : undefined
              }
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <FieldError
              id="post-category-error"
              errors={fieldErrors.category}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-tags">태그</Label>
            <Input
              id="post-tags"
              name="tags"
              aria-invalid={!!fieldErrors.tags}
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="쉼표로 구분 (최대 10개)"
              aria-describedby={cn(
                "post-tags-help",
                fieldErrors.tags && "post-tags-error",
              )}
            />
            {tags.length > 0 && (
              <ul aria-label="입력된 태그" className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <li key={tag}>
                    <Badge variant="secondary">{tag}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p
              id="post-tags-help"
              role={tagsOverflow ? "alert" : undefined}
              className={cn(
                "text-xs",
                tagsOverflow ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {tagsOverflow
                ? `태그는 최대 ${TAGS_MAX}개까지 사용할 수 있습니다. 초과분은 무시됩니다.`
                : `${tags.length}/${TAGS_MAX}개`}
            </p>
            <FieldError id="post-tags-error" errors={fieldErrors.tags} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-excerpt">소개글</Label>
            <Textarea
              id="post-excerpt"
              name="excerpt"
              aria-invalid={!!fieldErrors.excerpt}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="목록 카드에 보일 짧은 소개"
              aria-describedby={cn(
                "post-excerpt-count",
                fieldErrors.excerpt && "post-excerpt-error",
              )}
            />
            <p
              id="post-excerpt-count"
              className={cn(
                "text-right text-xs",
                excerptOver ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {excerpt.length}/{EXCERPT_MAX}
            </p>
            <FieldError id="post-excerpt-error" errors={fieldErrors.excerpt} />
          </div>

          <ThumbnailField
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
            error={fieldErrors.thumbnail_url?.[0]}
            onBusyChange={setThumbnailBusy}
          />
        </div>

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
            >
              <ArrowLeftIcon aria-hidden="true" />
              나가기
            </Link>
            {state.message && (
              <p
                role={state.ok ? "status" : "alert"}
                className={cn(
                  "min-w-0 flex-1 text-right text-sm",
                  state.ok ? "text-muted-foreground" : "text-destructive",
                )}
              >
                {state.message}
              </p>
            )}
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
