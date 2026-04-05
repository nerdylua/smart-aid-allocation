"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

interface Assignment {
  id: string;
  case_id: string;
  status: string;
  match_rationale: string | null;
  sla_deadline: string | null;
  cases: { title: string; location_label: string | null; description: string | null };
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useRealtimeRefresh(["assignments", "cases"]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    // In production, filter by logged-in volunteer's ID
    const res = await fetch("/api/cases?limit=100");
    const cases = await res.json();

    // Flatten assignments from all cases
    const allAssignments: Assignment[] = [];
    for (const c of cases) {
      for (const a of c.assignments ?? []) {
        allAssignments.push({
          ...a,
          cases: {
            title: c.title,
            location_label: c.location_label,
            description: c.description,
          },
        });
      }
    }
    setAssignments(allAssignments);
    setLoading(false);
  }

  async function updateStatus(assignmentId: string, status: string) {
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    // Auto-update volunteer action status
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      const volunteerId = (assignment as unknown as { volunteer_id?: string }).volunteer_id;
      if (volunteerId) {
        const actionMap: Record<string, string> = {
          accepted: "responding",
          in_progress: "on_scene",
          completed: "idle",
        };
        if (actionMap[status]) {
          await fetch(`/api/volunteers/${volunteerId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: actionMap[status] }),
          });
        }
      }
    }

    fetchAssignments();
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading assignments...</div>;
  }

  const active = assignments.filter((a) =>
    ["assigned", "accepted", "in_progress"].includes(a.status)
  );
  const completed = assignments.filter((a) =>
    ["completed", "closed"].includes(a.status)
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Assignments</h2>
        <p className="text-muted-foreground">
          View and manage volunteer assignments.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Active ({active.length})</h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active assignments</p>
        ) : (
          <div className="space-y-3">
            {active.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {a.cases.title}
                    </CardTitle>
                    <Badge variant="secondary">{a.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {a.cases.location_label}
                  </p>
                </CardHeader>
                <CardContent>
                  {a.cases.description && (
                    <p className="text-sm mb-3">{a.cases.description}</p>
                  )}
                  {a.match_rationale && (
                    <p className="text-xs text-muted-foreground mb-3">
                      {a.match_rationale}
                    </p>
                  )}
                  {a.sla_deadline && (
                    <p className="text-xs text-muted-foreground mb-3">
                      SLA Deadline: {new Date(a.sla_deadline).toLocaleString()}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {a.status === "assigned" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateStatus(a.id, "accepted")}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(a.id, "rejected")}
                        >
                          Decline
                        </Button>
                      </>
                    )}
                    {a.status === "accepted" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(a.id, "in_progress")}
                      >
                        Start Work
                      </Button>
                    )}
                    {a.status === "in_progress" && (
                      <Button
                        size="sm"
                        onClick={() => updateStatus(a.id, "completed")}
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {completed.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Completed ({completed.length})
          </h3>
          <div className="space-y-2">
            {completed.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div>
                  <span className="font-medium text-sm">{a.cases.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {a.cases.location_label}
                  </span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {a.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
