"use client";

import { useState, type ReactNode } from "react";
import { FieldError } from "@/app/admin/posts/_components/field-error";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/posts/slugify";
import { parseTags, POST_LIMITS } from "@/lib/schemas/post";
import type { Post } from "@/lib/types/post";
import { cn } from "@/lib/utils";

const EXCERPT_MAX = POST_LIMITS.excerpt;
const TAGS_MAX = POST_LIMITS.tags;
// 공개 글 상세 라우트(app/(site)/blog/[slug])와 같다. 편집기에서는 수정할 수 없다.
const POST_PATH_PREFIX = "/blog/";

interface PostMetaFieldsProps {
  /** 수정 모드일 때 불러온 글. 없으면 새 글 작성 모드. */
  initialPost?: Post;
  fieldErrors: Partial<Record<string, string[]>>;
  /** 래퍼 레이아웃 클래스(모바일 탭 숨김 등). */
  className?: string;
  /** 메타 필드 아래에 이어 붙일 필드(썸네일 등). */
  children?: ReactNode;
}

// 메타데이터 필드(제목·슬러그·카테고리·태그·소개글). 값은 폼 name으로 제출되므로 상태는 여기서만 쓴다.
export function PostMetaFields({
  initialPost,
  fieldErrors,
  className,
  children,
}: PostMetaFieldsProps) {
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  // 사용자가 슬러그를 직접 수정하면 제목 기반 자동 제안을 멈춘다. 수정 모드에서는 처음부터 끈다.
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost));
  const [category, setCategory] = useState(initialPost?.category ?? "일반");
  const [tagInput, setTagInput] = useState(initialPost?.tags.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");

  const allTags = parseTags(tagInput);
  const tags = allTags.slice(0, TAGS_MAX);
  const tagsOverflow = allTags.length > TAGS_MAX;
  const excerptOver = excerpt.length > EXCERPT_MAX;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <div className={className}>
      <div className="grid gap-2">
        <Label htmlFor="post-title">제목</Label>
        <Input
          id="post-title"
          name="title"
          aria-invalid={!!fieldErrors.title}
          aria-describedby={fieldErrors.title ? "post-title-error" : undefined}
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
            aria-describedby={fieldErrors.slug ? "post-slug-error" : undefined}
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
        <FieldError id="post-category-error" errors={fieldErrors.category} />
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

      {children}
    </div>
  );
}
