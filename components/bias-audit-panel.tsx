"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GroupStat {
  group: string;
  case_count: number;
  avg_severity: number;
  avg_vulnerability: number;
  avg_priority_score: number;
  flag_rate: number;
}

interface BiasData {
  by_region: GroupStat[];
  by_language: GroupStat[];
  by_need_type: GroupStat[];
  disparity: {
    region: number | null;
    language: number | null;
    need_type: number | null;
  };
  total_assessed: number;
}

function DisparityBadge({ ratio }: { ratio: number | null }) {
  if (ratio === null) return <Badge variant="secondary">N/A</Badge>;
  if (ratio === Infinity)
    return <Badge variant="secondary" className="bg-red-100 text-red-800">Infinite</Badge>;
  if (ratio <= 1.2)
    return <Badge variant="secondary" className="bg-green-100 text-green-800">{ratio.toFixed(2)}</Badge>;
  if (ratio <= 1.5)
    return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{ratio.toFixed(2)}</Badge>;
  return <Badge variant="secondary" className="bg-red-100 text-red-800">{ratio.toFixed(2)}</Badge>;
}

function BarChart({ items, valueKey, label }: { items: GroupStat[]; valueKey: keyof GroupStat; label: string }) {
  const maxVal = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
      {items.slice(0, 8).map((item) => {
        const val = Number(item[valueKey]) || 0;
        const width = Math.max((val / maxVal) * 100, 2);
        return (
          <div key={item.group} className="flex items-center gap-2 text-sm">
            <span className="w-28 truncate text-xs text-muted-foreground" title={item.group}>
              {item.group}
            </span>
            <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-sm"
                style={{ width: `${width}%` }}
              />
            </div>
            <span className="w-10 text-xs text-right font-mono">
              {valueKey === "flag_rate" ? `${(val * 100).toFixed(0)}%` : val.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function BiasAuditPanel() {
  const [data, setData] = useState<BiasData | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch("/api/reports/bias")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  if (!data) return null;
  if (data.total_assessed === 0) return null;

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Bias Audit ({data.total_assessed} assessments)
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {expanded ? "Collapse" : "Expand"}
          </span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-6">
          {/* Disparity Ratios */}
          <div>
            <p className="text-sm font-medium mb-2">Disparity Ratios</p>
            <div className="flex gap-4 flex-wrap">
              <div className="text-sm">
                By Region: <DisparityBadge ratio={data.disparity.region} />
              </div>
              <div className="text-sm">
                By Language: <DisparityBadge ratio={data.disparity.language} />
              </div>
              <div className="text-sm">
                By Need Type: <DisparityBadge ratio={data.disparity.need_type} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Disparity ratio measures whether AI triage flags cases at similar rates across groups.
              Values &gt;1.2 may indicate bias. Green = fair, yellow = watch, red = investigate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BarChart items={data.by_region} valueKey="avg_priority_score" label="Avg Priority by Region" />
            <BarChart items={data.by_language} valueKey="flag_rate" label="Flag Rate by Language" />
            <BarChart items={data.by_need_type} valueKey="avg_severity" label="Avg Severity by Need Type" />
            <BarChart items={data.by_region} valueKey="flag_rate" label="Flag Rate by Region" />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
