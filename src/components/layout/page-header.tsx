const TODAY_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const today = TODAY_FORMATTER.format(new Date());

  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-baseline gap-3">
        <h1 className="text-lg font-semibold">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <time className="text-sm text-muted-foreground">{today}</time>
    </header>
  );
}
