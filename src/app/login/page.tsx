import { Library } from "lucide-react";

import LoginForm from "./login-form";

export const preferredRegion = ["icn1"];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-8 shadow-sm sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10">
              <Library className="size-7 text-primary" />
            </div>
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              School Library
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              더힘스쿨 수지점
            </p>
          </div>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          교사 공용 관리자 계정으로 로그인하세요
        </p>
      </div>
    </main>
  );
}
