-- blog-images 버킷에 관리자 전용 select 정책 추가 (ROADMAP Task 029: 스토리지 고아 이미지 정리)
-- 관리자 판별은 app_metadata.role = 'admin' 만 사용한다(사용자가 수정 가능한 메타데이터는 인가에 쓰지 않는다).

-- 배경: 20261026105803_create_blog_images_bucket.sql 은 select 정책을 의도적으로 두지 않았다.
-- (public 버킷은 공개 URL 접근에 select 정책이 필요 없고, 정책이 있으면 list API로 파일 목록이 노출되기 때문)
-- 그 결과 관리자도 list 로 고아 파일을 찾거나 remove 로 삭제할 수 없었다.
-- (remove 는 DELETE 정책 외에 대상 행을 읽을 SELECT 권한도 필요하다. 직접 SQL 삭제는 storage.protect_delete() 트리거가 막는다.)
--
-- 변경된 설계:
-- - 정책의 대상 역할은 authenticated 이고 app_metadata.role = 'admin' 조건을 함께 둔다.
--   따라서 anon(비로그인)과 일반 로그인 사용자의 list 는 지금처럼 차단된다(빈 결과).
-- - 관리자만 list·remove 를 할 수 있다.
-- - 공개 URL(/storage/v1/object/public/blog-images/...) 접근은 public 버킷 설정으로 이뤄지므로 이 정책과 무관하게 유지된다.

-- select: 관리자만
create policy "blog_images_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'blog-images'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
