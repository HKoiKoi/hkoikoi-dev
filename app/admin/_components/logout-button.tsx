import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

type LogoutButtonProps = Pick<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
>;

export function LogoutButton({ variant, size }: LogoutButtonProps) {
  return (
    <form action={logout}>
      <Button type="submit" variant={variant} size={size}>
        로그아웃
      </Button>
    </form>
  );
}
