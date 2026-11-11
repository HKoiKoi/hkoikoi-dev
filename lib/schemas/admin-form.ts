// 이력·프로젝트·논문 관리자 폼이 공유하는 Server Action 상태 (useActionState)
export type AdminFormState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  // 검증 실패 시 입력값을 유지하기 위해 돌려주는 원본 값
  values?: Record<string, string>;
};
