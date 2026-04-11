"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CaseRow {
  id: string;
  title: string;
  status: string;
  location_label: string | null;
  language: string;
  created_at: string;
  assessments: { priority_score: number; severity: number; is_flagged: boolean }[];
}

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  triaged: "bg-yellow-100 text-yellow-800",
  matched: "bg-purple-100 text-purple-800",
  assigned: "bg-indigo-100 text-indigo-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

const PAGE_SIZE = 10;

export function CaseQueue({ cases }: { cases: CaseRow[] }) {
  // Sort by priority score (highest first), then by creation date.
  const sorted = useMemo(
    () =>
      [...cases].sort((a, b) => {
        const aScore = a.assessments?.[0]?.priority_score ?? 0;
        const bScore = b.assessments?.[0]?.priority_score ?? 0;
        if (bScore !== aScore) return bScore - aScore;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }),
    [cases]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const [page, setPage] = useState(1);
  const safePage = Math.min(page, totalPages);

  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pagedCases = sorted.slice(startIndex, startIndex + PAGE_SIZE);
  const showingFrom = sorted.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + PAGE_SIZE, sorted.length);

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <p className="text-xs text-muted-foreground">
          Showing {showingFrom}-{showingTo} of {sorted.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {safePage}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedCases.map((c) => {
              const assessment = c.assessments?.[0];
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-sm">
                    {assessment ? (
                      <span className="flex items-center gap-1">
                        {assessment.priority_score.toFixed(1)}
                        {assessment.is_flagged && (
                          <span className="text-orange-500" title="Flagged for review">
                            !
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/cases/${c.id}`}
                      className="font-medium hover:underline"
                    >
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusColors[c.status] ?? ""}
                    >
                      {c.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.location_label ?? "—"}
                  </TableCell>
                  <TableCell>
                    {assessment ? (
                      <span
                        className={
                          assessment.severity >= 8
                            ? "text-red-600 font-bold"
                            : assessment.severity >= 5
                              ? "text-orange-600"
                              : "text-muted-foreground"
                        }
                      >
                        {assessment.severity}/10
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.created_at.slice(0, 10)}
                  </TableCell>
                </TableRow>
              );
            })}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No cases found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
