"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

import { siteConfig } from "@/lib/site-config";

const GISCUS_ORIGIN = "https://giscus.app";
// 스크립트는 받았지만 iframe이 생기지 않는 경우를 실패로 본다.
const LOAD_TIMEOUT_MS = 15_000;

type GiscusTheme = "light" | "dark";

function toGiscusTheme(resolvedTheme: string | undefined): GiscusTheme {
  return resolvedTheme === "dark" ? "dark" : "light";
}

function GiscusEmbed({ postId }: { postId: string }) {
  const { repo, repoId, category, categoryId } = siteConfig.giscus;
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<GiscusTheme>(toGiscusTheme(resolvedTheme));
  // IntersectionObserver가 없는 환경은 바로 불러온다.
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const [failed, setFailed] = useState(false);

  const theme = toGiscusTheme(resolvedTheme);
  // next-themes는 마운트 전에 resolvedTheme이 undefined라, 값이 정해진 뒤에만 불러온다.
  const ready = visible && resolvedTheme !== undefined;

  // 로드 effect가 테마 변경마다 다시 돌지 않도록 최신 테마만 ref에 둔다.
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // 화면 가까이 오기 전에는 외부 스크립트·iframe을 만들지 않는다.
  useEffect(() => {
    const container = containerRef.current;
    if (visible || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    const container = containerRef.current;
    if (!ready || !container) return;

    const script = document.createElement("script");
    script.src = `${GISCUS_ORIGIN}/client.js`;
    script.async = true;
    script.crossOrigin = "anonymous";
    const attributes: Record<string, string> = {
      repo,
      "repo-id": repoId,
      category,
      "category-id": categoryId,
      // 슬러그가 바뀌어도 같은 토론에 연결되도록 글 id로 매핑한다.
      mapping: "specific",
      term: postId,
      strict: "0",
      "reactions-enabled": "1",
      "emit-metadata": "0",
      "input-position": "bottom",
      theme: themeRef.current,
      lang: "ko",
      loading: "lazy",
    };
    for (const [name, value] of Object.entries(attributes)) {
      script.setAttribute(`data-${name}`, value);
    }
    script.onerror = () => setFailed(true);
    container.appendChild(script);

    const timer = window.setTimeout(() => {
      if (!container.querySelector("iframe.giscus-frame")) setFailed(true);
    }, LOAD_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timer);
      container.replaceChildren();
    };
  }, [ready, postId, repo, repoId, category, categoryId]);

  // 이미 뜬 iframe의 테마는 새로 불러오지 않고 메시지로 바꾼다.
  useEffect(() => {
    const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
      "iframe.giscus-frame",
    );
    iframe?.contentWindow?.postMessage(
      { giscus: { setConfig: { theme } } },
      GISCUS_ORIGIN,
    );
  }, [theme]);

  return (
    <section aria-labelledby="comments-heading" className="space-y-4">
      <h2 id="comments-heading" className="text-lg font-semibold">
        댓글
      </h2>
      <div ref={containerRef} className="min-h-48" />
      {failed && (
        <p role="status" className="text-sm text-muted-foreground">
          댓글을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.
        </p>
      )}
    </section>
  );
}

export function Comments({ postId }: { postId: string }) {
  const { repo, repoId, category, categoryId } = siteConfig.giscus;
  if (!repo || !repoId || !category || !categoryId) return null;

  // 글이 바뀌면 상태(visible·failed)를 새로 시작한다.
  return <GiscusEmbed key={postId} postId={postId} />;
}
