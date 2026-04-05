"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface KpiData {
  total_cases: number;
  closure_rate: number;
  median_response_hours: number | null;
  flagged_cases: number;
  status_distribution: Record<string, number>;
}

export function KpiCards({ data }: { data: KpiData }) {
  const openCases =
    (data.status_distribution["new"] ?? 0) +
    (data.status_distribution["triaged"] ?? 0) +
    (data.status_distribution["matched"] ?? 0) +
    (data.status_distribution["assigned"] ?? 0) +
    (data.status_distribution["in_progress"] ?? 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total_cases}</div>
          <p className="text-xs text-muted-foreground">
            {openCases} open
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Closure Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.round(data.closure_rate * 100)}%
          </div>
          <p className="text-xs text-muted-foreground">
            of all cases
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Median Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.median_response_hours !== null
              ? `${data.median_response_hours}h`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            time to closure
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Flagged Cases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {data.flagged_cases}
          </div>
          <p className="text-xs text-muted-foreground">
            need human review
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
