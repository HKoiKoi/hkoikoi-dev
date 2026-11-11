import { FieldError } from "@/app/admin/_components/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps {
  name: string;
  label: string;
  /** 제출 실패 뒤 입력값 유지(state.values)와 수정 모드 초기값을 합친 값 */
  defaultValue: string;
  errors?: string[];
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "number";
  inputMode?: "numeric" | "url" | "text";
}

// 라벨 + 입력 + 필드 오류(role=alert, aria-describedby 연결). 폼 요소 이름이 곧 필드 이름이다.
export function FormField({
  name,
  label,
  defaultValue,
  errors,
  hint,
  required,
  multiline,
  rows = 3,
  placeholder,
  type = "text",
  inputMode,
}: FormFieldProps) {
  const id = `field-${name}`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const hasError = !!errors && errors.length > 0;
  const describedBy =
    [hasError ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          name={name}
          rows={rows}
          defaultValue={defaultValue}
          aria-required={required}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={describedBy}
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          inputMode={inputMode}
          defaultValue={defaultValue}
          aria-required={required}
          placeholder={placeholder}
          aria-invalid={hasError}
          aria-describedby={describedBy}
        />
      )}
      {hint && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={errorId} errors={errors} />
    </div>
  );
}
