-- anon은 select만, authenticated는 select/insert/update/delete만 남긴다.
-- public 스키마의 default privileges가 새 테이블에 모든 권한을 주므로 posts에서 회수한다.
revoke insert, update, delete, truncate, references, trigger on public.posts from anon;
revoke truncate, references, trigger on public.posts from authenticated;
