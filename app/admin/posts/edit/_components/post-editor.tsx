"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/posts/slugify";
import { cn } from "@/lib/utils";

const EXCERPT_MAX = 150;
const TAGS_MAX = 10;
// 공개 글 상세 라우트(app/(site)/blog/[slug])와 같다. 편집기에서는 수정할 수 없다.
const POST_PATH_PREFIX = "/blog/";

/** 쉼표로 구분된 입력을 trim·빈 값 제거·중복 제거한 태그 배열로 바꾼다. */
function parseTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(tags)];
}

export function PostEditor() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  // 사용자가 슬러그를 직접 수정하면 제목 기반 자동 제안을 멈춘다.
  const [slugTouched, setSlugTouched] = useState(false);
  const [category, setCategory] = useState("일반");
  const [tagInput, setTagInput] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  // 본문은 편집기가 보유한다. Task 009-c 미리보기가 같은 값을 사용한다.
  const [content, setContent] = useState("");
  // 모바일(lg 미만) 전용 탭 선택값. 두 패널은 항상 마운트되고 CSS로만 숨겨 입력값이 유지된다.
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");

  const allTags = parseTags(tagInput);
  const tags = allTags.slice(0, TAGS_MAX);
  const tagsOverflow = allTags.length > TAGS_MAX;
  const excerptOver = excerpt.length > EXCERPT_MAX;

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  return (
    <div className="grid gap-4">
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
        className="grid gap-6"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
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
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="글 제목"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-slug">URL</Label>
            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground select-none">
                {POST_PATH_PREFIX}
              </span>
              <Input
                id="post-slug"
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                placeholder="제목 입력 시 자동 제안"
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-category">카테고리</Label>
            <Input
              id="post-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-tags">태그</Label>
            <Input
              id="post-tags"
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="쉼표로 구분 (최대 10개)"
              aria-describedby="post-tags-help"
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="post-excerpt">소개글</Label>
            <Textarea
              id="post-excerpt"
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="목록 카드에 보일 짧은 소개"
              aria-describedby="post-excerpt-count"
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
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium">썸네일</span>
            {/* TODO: Task 014에서 업로드·미리보기·제거 UI로 교체한다. */}
            <div className="flex h-32 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              썸네일 업로드는 준비 중입니다
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="post-published"
              className="size-6 rounded-md [&_svg]:size-5!"
              checked={published}
              onCheckedChange={(checked) => setPublished(checked)}
            />
            <Label htmlFor="post-published">발행</Label>
          </div>
        </div>

        {/* 본문 입력과 미리보기를 나란히 둔다. 모바일에서는 탭으로 전환한다. */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <div
            className={cn(
              "gap-2",
              mobileTab === "write" ? "grid" : "hidden lg:grid",
            )}
          >
            <Label htmlFor="post-content">본문</Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="마크다운으로 본문을 작성하세요"
              className="min-h-96 font-mono lg:h-full"
            />
          </div>

          {/* TODO: Task 015·016에서 MarkdownContent로 교체한다. 지금은 본문 원문을 그대로 표시한다. */}
          <section
            aria-label="미리보기"
            className={cn(
              "min-w-0 gap-2 lg:grid lg:grid-rows-[auto_1fr]",
              mobileTab === "preview" ? "grid grid-rows-[auto_1fr]" : "hidden",
            )}
          >
            {/* 본문 Label과 같은 높이로 맞춰 두 입력 영역의 상단선을 정렬한다. */}
            <h2 className="text-sm leading-none font-medium">미리보기</h2>
            <div className="min-h-96 rounded-lg border bg-card p-4 text-card-foreground">
              {content ? (
                <div className="text-sm break-words whitespace-pre-wrap">
                  {content}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  본문을 입력하면 여기에 표시됩니다
                </p>
              )}
            </div>
          </section>
        </div>

        <div>
          {/* TODO: Task 013에서 저장 동작을 연결한다. */}
          <Button type="submit" disabled>
            저장
          </Button>
        </div>
      </form>
    </div>
  );
}
