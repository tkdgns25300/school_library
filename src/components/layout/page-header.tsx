import { Calendar } from "lucide-react";

import { MobileNav } from "./sidebar";
import { TodayDate } from "./today-date";

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav />
        <div className="flex min-w-0 items-baseline gap-3">
          <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? (
            <p className="hidden truncate text-sm text-muted-foreground sm:block">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="size-4" />
        <TodayDate />
      </div>
    </header>
  );
}
