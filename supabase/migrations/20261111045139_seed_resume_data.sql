-- 이력·프로젝트·논문 시드 (ROADMAP Task 032)
-- data/*.ts의 현재 내용을 그대로 옮긴다(저장소에 이미 공개된 내용). 배열 순서는 sort_order(10 단위)가 된다.
-- 생성 스크립트로 만든 파일이며 한 번만 적용한다. 멱등 처리는 하지 않고, 대상 테이블에 행이 있으면 실패한다.

do $$
begin
  if exists (select 1 from public.resume_entries)
     or exists (select 1 from public.projects)
     or exists (select 1 from public.publications) then
    raise exception '시드 대상 테이블에 이미 행이 있어 중단한다';
  end if;
end $$;

-- education (3건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$education$q$, $q$서울신학대학교 일반대학원$q$, $q$IT융합학과 석사$q$, $q$2024.09.02 ~ 2026.08.20$q$, $q$본교 · 경기도 · 졸업$q$, $q$4.2 / 4.5$q$, null, '{}'::text[], $q$[]$q$::jsonb, null, 10),
  ($q$education$q$, $q$서울신학대학교$q$, $q$기독교교육과 학사 (부전공: IT융합소프트웨어학과)$q$, $q$2018.02.26 ~ 2024.08.19$q$, $q$본교 · 경기도 · 졸업$q$, $q$3.87 / 4.5$q$, null, '{}'::text[], $q$[]$q$::jsonb, null, 20),
  ($q$education$q$, $q$강화고등학교$q$, $q$주간$q$, $q$2015.03.02 ~ 2018.02.06$q$, $q$인천광역시 · 졸업$q$, null, null, '{}'::text[], $q$[]$q$::jsonb, null, 30);

-- career (1건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$career$q$, $q$(주)신나는플랫폼$q$, $q$기술연구소 · 주임 · 정규직$q$, $q$2024.07.15 ~ 2025.12.31$q$, $q$대학 포털 사이트와 NCS 웹정보시스템 개발 및 유지보수 · 국립국제교육원 국외인적자원시스템 클라우드 전환 사업 진행 및 유지보수 ·
사내 온프레미스 서버 인프라 구축 및 관리$q$, null, null, '{}'::text[], $q$[{"label":"개발","tags":["Java","JSP","Spring Boot","MyBatis","jQuery","React"]},{"label":"데이터베이스","tags":["Oracle","MariaDB","MS-SQL"]},{"label":"인프라·배포","tags":["AWS","Ubuntu","JBoss","Jenkins"]}]$q$::jsonb, null, 10);

-- certifications (2건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$certifications$q$, $q$SQL 개발자 (SQLD)$q$, $q$한국데이터산업진흥원$q$, $q$2024.12.13$q$, null, null, null, '{}'::text[], $q$[]$q$::jsonb, null, 10),
  ($q$certifications$q$, $q$정보처리기사$q$, $q$한국산업인력공단$q$, $q$2024.03.13$q$, null, null, null, '{}'::text[], $q$[]$q$::jsonb, null, 20);

-- volunteer (1건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$volunteer$q$, $q$암미지역아동센터$q$, $q$교육/멘토링$q$, $q$2023.07 ~ 2024.07$q$, $q$중학교 학생 대상으로 수학 교육 봉사$q$, $q$61시간$q$, $q$봉사 참여 시간$q$, '{}'::text[], $q$[]$q$::jsonb, null, 10);

-- languages (1건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$languages$q$, $q$영어$q$, $q$TOEIC · YBM$q$, $q$2026.08.30$q$, null, $q$620$q$, $q$TOEIC 점수$q$, '{}'::text[], $q$[]$q$::jsonb, null, 10);

-- activities (1건)
insert into public.resume_entries
  (section, title, subtitle, period, description, grade, grade_label, tags, tag_groups, link, sort_order)
values
  ($q$activities$q$, $q$서울신학대학교 기독교교육과 학생회$q$, $q$학생회/자치활동$q$, $q$2022.12 ~ 2023.12$q$, $q$학생회 회장단 회계업무 수행. 각 부서 리더들과 지속적으로 소통해 체계적이고 효율적인 지출 집행$q$, null, null, '{}'::text[], $q$[]$q$::jsonb, null, 10);

-- projects (4건)
insert into public.projects
  (name, summary, period, role, stack, github_url, demo_url, featured, sort_order)
values
  ($q$hkoikoi.dev$q$, $q$이력과 프로젝트를 공개하고 마크다운으로 블로그 글을 발행하는 개인 포트폴리오·블로그 사이트$q$, $q$2026.10 ~ 진행 중$q$, $q$개인 프로젝트$q$, array[$q$Next.js$q$, $q$TypeScript$q$, $q$Supabase$q$, $q$Tailwind CSS$q$, $q$shadcn/ui$q$]::text[], $q$https://github.com/HKoiKoi/hkoikoi-dev$q$, null, true, 10),
  ($q$Distributed Lock Burst Benchmark$q$, $q$수강신청 시스템을 모사해 버스트 트래픽 상황에서 RDBMS, Redis, ZooKeeper 기반 동시성 제어 전략의 성능과 안정성을 비교한 석사논문 연구$q$, $q$2026.03 ~ 2026.06$q$, $q$석사논문 연구$q$, array[$q$Java$q$, $q$Spring Boot$q$, $q$Spring Data JPA$q$, $q$MySQL$q$, $q$Redis$q$, $q$ZooKeeper$q$, $q$nGrinder$q$, $q$Nginx$q$]::text[], $q$https://github.com/HKoiKoi/concurrency-control-benchmarks$q$, null, true, 20),
  ($q$SCO 순찰 일지$q$, $q$SCO 관리형 독서실의 순찰 업무를 스마트폰·태블릿에서 최소 터치로 기록하고 일지를 조회하는 웹 앱$q$, $q$2026.10$q$, $q$개인 프로젝트$q$, array[$q$Next.js$q$, $q$TypeScript$q$, $q$Supabase$q$, $q$Tailwind CSS$q$, $q$shadcn/ui$q$]::text[], $q$https://github.com/HKoiKoi/hkoikoi-sco-patrol$q$, $q$https://sco.hkoikoi.dev$q$, true, 30),
  ($q$노션 타이핑 연습$q$, $q$노션 데이터베이스의 예문을 불러와 글자별 실시간 판정과 결과 요약을 제공하는 타이핑 연습 웹앱$q$, $q$2026.10$q$, $q$개인 프로젝트$q$, array[$q$Next.js$q$, $q$TypeScript$q$, $q$Notion API$q$, $q$Tailwind CSS$q$, $q$shadcn/ui$q$]::text[], $q$https://github.com/HKoiKoi/hkoikoi-typing-web-notion-claude$q$, $q$https://typing.hkoikoi.dev$q$, false, 40);

-- publications (3건, 배열 순서 그대로)
insert into public.publications
  (title, authors, venue, year, link, sort_order)
values
  ($q$분산 WAS 환경에서의 RDBMS, Redis 및 ZooKeeper 기반 락 메커니즘의 성능 비교 분석$q$, $q$함상현, 박채은, 정택준, 김문성$q$, $q$한국인터넷정보학회 인터넷컴퓨팅 및 서비스(JICS) 27(5), 129-137$q$, 2026, $q$https://www.jics.or.kr/digital-library/108406$q$, 10),
  ($q$Design of an Adaptive Framework Based on Performance Analysis of Distributed Lock Mechanisms in Distributed WAS Environments$q$, $q$함상현$q$, $q$서울신학대학교 일반대학원 석사학위논문$q$, 2026, $q$https://www.riss.kr/search/detail/DetailView.do?p_mat_type=be54d9b8bc7cdb09&control_no=318a430b2707065fffe0bdc3ef48d419$q$, 20),
  ($q$다중 WAS 환경에서의 RDBMS와 Redis 기반 락 메커니즘 비교 연구$q$, $q$박채은, 함상현, 김선정, 정택준, 박기섭, 김문성$q$, $q$2026년도 한국인터넷정보학회 춘계학술발표대회 논문집 27(1)$q$, 2026, null, 30);
