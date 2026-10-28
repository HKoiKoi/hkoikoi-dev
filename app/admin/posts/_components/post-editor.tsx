"use client";

import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { savePost } from "@/app/admin/posts/actions";
import { FieldError } from "@/app/admin/posts/_components/field-error";
import { ImageUploadButton } from "@/app/admin/posts/_components/image-upload-button";
import { MarkdownPreview } from "@/app/admin/posts/_components/markdown-preview";
import { PostMetaFields } from "@/app/admin/posts/_components/post-meta-fields";
import { ThumbnailField } from "@/app/admin/posts/_components/thumbnail-field";
import { useContentUpload } from "@/app/admin/posts/_components/use-content-upload";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { type PostActionState } from "@/lib/schemas/post";
import type { Post } from "@/lib/types/post";
import { cn } from "@/lib/utils";

const initialState: PostActionState = { ok: false };

interface PostEditorProps {
  /** 수정 모드일 때 불러온 글. 없으면 새 글 작성 모드. */
  initialPost?: Post;
}

export function PostEditor({ initialPost }: PostEditorProps) {
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
  } = useContentUpload(initialPost?.content ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialPost?.thumbnail_url ?? "",
  );
  const [thumbnailBusy, setThumbnailBusy] = useState(false);
  // 모바일(lg 미만) 전용 탭 선택값. 두 패널은 항상 마운트되고 CSS로만 숨겨 입력값이 유지된다.
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  const isEdit = Boolean(initialPost);
  const isUploading = uploadingCount > 0 || thumbnailBusy;

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
        <PostMetaFields
          initialPost={initialPost}
          fieldErrors={fieldErrors}
          className={cn(
            "gap-6",
            mobileTab === "write" ? "grid" : "hidden lg:grid",
          )}
        >
          <ThumbnailField
            value={thumbnailUrl}
            onChange={setThumbnailUrl}
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
