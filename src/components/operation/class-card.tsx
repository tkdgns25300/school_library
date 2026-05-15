import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type Props = {
  id: string;
  label: string;
  description: string;
};

export function ClassCard({ id, label, description }: Props) {
  return (
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
          <Metric label="학생" value="—" />
          <Metric label="대여 중" value="—" />
          <Metric label="연체" value="—" />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-lg font-semibold">{value}</div>
    </div>
  );
}
