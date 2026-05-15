import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  id: string;
  label: string;
  description: string;
  grades: ReadonlyArray<number>;
  studentCount: number;
  activeCount: number;
  overdueCount: number;
};

export function ClassCard({
  id,
  label,
  description,
  grades,
  studentCount,
  activeCount,
  overdueCount,
}: Props) {
  const gradeLabel = `${grades.join("·")}학년`;

  return (
    <Link
      href={`/operation/${encodeURIComponent(id)}`}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between p-6 pb-4">
          <Badge variant="secondary">{id}</Badge>
          <span className="text-xs text-muted-foreground">{gradeLabel}</span>
        </div>
        <div className="px-6 pb-5">
          <div className="text-2xl font-bold tracking-tight">{label}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        <Separator />
        <div className="grid grid-cols-3 gap-3 px-6 py-5">
          <Metric label="학생" value={studentCount} unit="명" />
          <Metric label="대여 중" value={activeCount} unit="권" />
          <Metric
            label="연체"
            value={overdueCount}
            unit="권"
            tone={overdueCount > 0 ? "alert" : undefined}
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between px-6 py-3.5 text-sm font-medium text-primary">
          <span>이 반 운영하기</span>
          <ArrowRight className="size-4" />
        </div>
      </Card>
    </Link>
  );
}

function Metric({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone?: "alert";
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className={
            tone === "alert"
              ? "text-2xl font-bold text-destructive"
              : "text-2xl font-bold"
          }
        >
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}
