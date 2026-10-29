import { LoginForm } from "@/app/auth/login/_components/login-form";

export default function Page() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-svh w-full items-center justify-center p-6 outline-none md:p-10"
    >
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
