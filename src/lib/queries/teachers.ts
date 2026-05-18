import { createServiceClient } from "@/lib/supabase/service";

export type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

export async function getTeachers(): Promise<Teacher[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("teachers")
    .select("id, name, class_section")
    .order("name");
  return data ?? [];
}
