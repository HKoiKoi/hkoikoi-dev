import { Suspense } from "react";

import { AdminLink } from "@/components/layout/admin-link";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter>
        <Suspense fallback={null}>
          <AdminLink />
        </Suspense>
      </SiteFooter>
    </div>
  );
}
