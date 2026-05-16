import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";

import { TeachersView } from "./teachers-view";

export const revalidate = 1800;

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("id, name, class_section")
    .order("name");

  return (
    <>
      <PageHeader title="교사" subtitle="담당자 명단" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <TeachersView teachers={data ?? []} />
        </div>
      </main>
    </>
  );
}
