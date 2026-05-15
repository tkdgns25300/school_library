import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">School Library</h1>
          <p className="text-sm text-muted-foreground">
            더힘스쿨 수지점 관리자 로그인
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
