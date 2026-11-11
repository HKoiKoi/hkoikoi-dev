import { connection } from "next/server";

import { getPostViewCount } from "@/lib/queries/post-views";

const numberFormat = new Intl.NumberFormat("ko-KR");

// 조회수는 요청마다 달라지므로 요청 시점까지 미룬다. 호출 측이 별도 Suspense로 감싼다.
export async function ViewCount({ postId }: { postId: string }) {
  await connection();
  const count = await getPostViewCount(postId);
  if (count === null) return null;

  return (
    <span className="text-sm text-muted-foreground">
      조회 {numberFormat.format(count)}
    </span>
  );
}
