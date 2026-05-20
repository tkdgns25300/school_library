import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

const LOGIN_PATH = "/login";
const HOME_PATH = "/";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && pathname !== LOGIN_PATH) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = LOGIN_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  if (user && pathname === LOGIN_PATH) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = HOME_PATH;
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

// 인증 게이트 제외 경로:
// - Next.js 내부 자산
// - 공개 이미지(OG 이미지) — 카카오톡 등 크롤러 접근 허용
// - cron 엔드포인트 — Bearer 토큰으로 자체 인증
// - 정적 이미지 확장자 (icon.png · public/** 포함)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
