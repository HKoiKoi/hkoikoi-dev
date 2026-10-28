// 공개·관리자 쿼리가 같은 컬럼 이름을 쓰도록 한 곳에서 관리한다. 목록은 content를 뺀다.
export const SUMMARY_COLUMNS =
  "id, slug, title, excerpt, thumbnail_url, category, tags, published, published_at, created_at, updated_at";
export const POST_COLUMNS = `${SUMMARY_COLUMNS}, content`;
