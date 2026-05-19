import { Library } from "lucide-react";

import LoginForm from "./login-form";

export const preferredRegion = ["icn1"];

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-4 py-12">
      {/* 백그라운드 그라데이션 orb — 페이지의 유일한 애니메이션 */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 size-96 rounded-full bg-[oklch(0.65_0.18_262/0.30)] blur-3xl [animation:drift_18s_ease-in-out_infinite]" />
        <div className="absolute -right-40 top-1/3 size-[28rem] rounded-full bg-[oklch(0.70_0.18_150/0.20)] blur-3xl [animation:drift-alt_22s_ease-in-out_infinite]" />
        <div className="absolute -bottom-32 left-1/4 size-[24rem] rounded-full bg-[oklch(0.70_0.14_262/0.22)] blur-3xl [animation:drift-soft_16s_ease-in-out_infinite]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/60 bg-white/75 p-8 shadow-[0_20px_60px_-15px_oklch(0.32_0.13_262/0.25)] backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            {/* 로고 — 추후 학교 로고 Image 컴포넌트로 교체 */}
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.45_0.16_262)] shadow-lg shadow-primary/30">
              <Library className="size-8 text-white" strokeWidth={1.8} />
            </div>
            <h1
              className="bg-gradient-to-br from-[oklch(0.20_0.10_262)] via-[oklch(0.32_0.13_262)] to-[oklch(0.45_0.16_262)] bg-clip-text px-2 text-6xl leading-tight tracking-tight text-transparent"
              style={{ fontFamily: "var(--font-handwritten)" }}
            >
              School Library
            </h1>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/30" />
              <p className="text-xs font-medium tracking-[0.3em] text-primary/70">
                더힘스쿨 · 수지점
              </p>
              <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/30" />
            </div>
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
