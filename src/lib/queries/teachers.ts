import { unstable_cache } from "next/cache";

import { createServiceClient } from "@/lib/supabase/service";

export type Teacher = {
  id: string;
  name: string;
  class_section: string;
};

export const getTeachers = unstable_cache(
  async (): Promise<Teacher[]> => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("teachers")
      .select("id, name, class_section")
      .order("name");
    return data ?? [];
  },
  ["teachers-list"],
  { tags: ["teachers"], revalidate: 1800 },
);
