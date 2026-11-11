interface FieldErrorProps {
  id: string;
  errors?: string[];
}

// 필드별 서버 검증 오류 (입력의 aria-describedby와 id로 연결)
export function FieldError({ id, errors }: FieldErrorProps) {
  if (!errors || errors.length === 0) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {errors[0]}
    </p>
  );
}
