import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  description: string;
  studentCount: number;
  activeCount: number;
  overdueCount: number;
};

export function ClassCard({
  id,
  label,
  description,
  studentCount,
  activeCount,
  overdueCount,
}: Props) {
  return (
    <Link
      href={`/operation/${encodeURIComponent(id)}`}
      className="group block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="overflow-hidden rounded-3xl border-border/40 py-0 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-2xl group-hover:shadow-primary/15">
        {/* Navy 그라데이션 헤더 + 데코 orb */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-[oklch(0.32_0.13_262)] to-[oklch(0.42_0.14_262)] px-7 py-8 text-white">
          <div className="absolute -right-10 -top-10 size-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-6 size-24 rounded-full bg-white/[0.06] blur-2xl" />
          <div className="relative">
            <h3 className="text-3xl font-bold tracking-tight">{label}</h3>
            <p className="mt-1.5 text-sm text-white/70">{description}</p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-3 divide-x divide-border/60">
          <Metric value={studentCount} label="학생" />
          <Metric
            value={activeCount}
            label="대여 중"
            tone={activeCount > 0 ? "primary" : "muted"}
          />
          <Metric
            value={overdueCount}
            label="연체"
            tone={overdueCount > 0 ? "alert" : "muted"}
          />
        </div>

        {/* 액션 */}
        <div className="flex items-center justify-between border-t border-border/60 bg-muted/40 px-6 py-4 text-sm font-medium text-primary transition-colors group-hover:bg-primary/10">
          <span>대여 데스크 열기</span>
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}

function Metric({
  value,
  label,
  tone = "default",
}: {
  value: number;
  label: string;
  tone?: "default" | "primary" | "alert" | "muted";
}) {
  const valueClass = cn(
    "text-4xl font-bold tracking-tight tabular-nums",
    tone === "primary" && "text-primary",
    tone === "alert" && "text-destructive",
    tone === "muted" && "text-muted-foreground/50",
  );

  return (
    <div className="px-3 py-7 text-center">
      <div className={valueClass}>{value}</div>
      <div className="mt-2 text-xs font-medium text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
