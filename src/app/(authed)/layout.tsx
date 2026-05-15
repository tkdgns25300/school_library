import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar email={user?.email ?? "관리자"} />
      <div className="flex flex-1 flex-col">{children}</div>
      <Toaster />
    </div>
  );
}
