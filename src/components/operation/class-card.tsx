import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <Badge variant="secondary" className="w-fit">
            {id}
          </Badge>
          <div className="mt-3 text-xl font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Metric label="학생" value={`${studentCount}명`} />
            <Metric label="대여 중" value={`${activeCount}권`} />
            <Metric
              label="연체"
              value={`${overdueCount}권`}
              tone={overdueCount > 0 ? "alert" : undefined}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "alert";
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={
          tone === "alert"
            ? "mt-0.5 text-lg font-semibold text-destructive"
            : "mt-0.5 text-lg font-semibold"
        }
      >
        {value}
      </div>
    </div>
  );
}
