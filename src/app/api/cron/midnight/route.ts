import { revalidateTag } from "next/cache";

const TAGS = ["students", "books", "teachers", "loans"] as const;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  for (const tag of TAGS) {
    revalidateTag(tag, "max");
  }

  return Response.json({ ok: true, refreshed: TAGS });
}
