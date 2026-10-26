import type { ReactNode } from "react";
import { cacheLife } from "next/cache";
import { GithubIcon, MailIcon } from "lucide-react";
import { profile } from "@/data/profile";
import { siteConfig } from "@/lib/site-config";

interface SiteFooterProps {
  // 링크 옆에 렌더링할 슬롯 (예: AdminLink)
  children?: ReactNode;
}

// 현재 연도: Cache Components에서 new Date()는 prerender 오류이므로 캐시된 값으로 계산
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

const linkClassName =
  "inline-flex items-center gap-1.5 rounded-md outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4";

// 사이트 하단 푸터 (정적 마크업)
export function SiteFooter({ children }: SiteFooterProps) {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>
          © <CopyrightYear /> {siteConfig.name}
        </p>
        <nav aria-label="연락처">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <li>
              <a
                href={`mailto:${profile.email}`}
                className={linkClassName}
                aria-label={`이메일 보내기: ${profile.email}`}
              >
                <MailIcon aria-hidden="true" />
                {profile.email}
              </a>
            </li>
            <li>
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
                aria-label="GitHub 프로필 (새 탭에서 열림)"
              >
                <GithubIcon aria-hidden="true" />
                GitHub
              </a>
            </li>
            {children ? <li>{children}</li> : null}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
