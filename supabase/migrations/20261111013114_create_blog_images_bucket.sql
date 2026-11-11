-- blog-images 스토리지 버킷과 storage.objects 정책 (ROADMAP Task 005 설계 / Task 010 구현)
-- 관리자 판별은 app_metadata.role = 'admin' 만 사용한다(사용자가 수정 가능한 메타데이터는 인가에 쓰지 않는다).

-- 1. 버킷 (멱등: 재실행 시 설정값을 갱신)
-- public 버킷: 공개 URL(/storage/v1/object/public/blog-images/...)로 누구나 이미지를 볼 수 있다.
-- SVG는 스크립트 삽입 위험이 있어 허용 MIME에서 제외한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2. 정책
-- 경로 규칙 YYYY/MM/<uuid>.<ext> 는 앱 업로드 코드(Task 017)가 책임진다. 정책은 경로를 검사하지 않는다.
--
-- select 정책은 의도적으로 만들지 않는다.
-- public 버킷은 공개 URL 접근에 select 정책이 필요 없고,
-- storage.objects에 select 정책을 두면 list API로 버킷의 파일 목록이 노출된다.
-- (참고: upsert는 INSERT+SELECT+UPDATE가 필요하지만, 업로드는 매번 새 uuid 경로로 하므로 upsert를 쓰지 않는다.)

-- insert: 관리자만
create policy "blog_images_insert_admin"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'blog-images'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- update: 관리자만 (using과 with check 모두 지정)
create policy "blog_images_update_admin"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'blog-images'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    bucket_id = 'blog-images'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );

-- delete: 관리자만
create policy "blog_images_delete_admin"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'blog-images'
    and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
  );
