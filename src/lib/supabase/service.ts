import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

// service-role 클라이언트는 RLS를 우회하므로 cached read에서만 사용.
// (authed) 라우트 진입은 proxy.ts가 이미 인증 게이트함. 변경(mutation)은 server.ts(쿠키 기반) 사용.
let cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createServiceClient() {
  if (cached) return cached;
  cached = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return cached;
}
