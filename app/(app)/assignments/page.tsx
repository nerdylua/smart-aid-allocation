"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRealtimeRefresh } from "@/hooks/use-realtime";

interface Assignment {
  id: string;
  case_id: string;
  volunteer_id: string;
  status: string;
  match_rationale: string | null;
  sla_deadline: string | null;
  cases: { title: string; location_label: string | null; description: string | null };
}

interface CaseWithAssignments {
  title: string;
  location_label: string | null;
  description: string | null;
  assignments?: Array<Omit<Assignment, "cases">>;
}

function getTodayInputValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRouteAssignmentIds, setSelectedRouteAssignmentIds] = useState<string[]>([]);
  const [plannedDate, setPlannedDate] = useState(getTodayInputValue);
  const [routeName, setRouteName] = useState("");
  const [routeCreating, setRouteCreating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useRealtimeRefresh(["assignments", "cases"]);

  const fetchAssignments = useCallback(async () => {
    // In production, filter by logged-in volunteer's ID
    const res = await fetch("/api/cases?limit=100");
    const cases = (await res.json()) as CaseWithAssignments[];

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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAssignments();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAssignments]);

  async function updateStatus(assignmentId: string, status: string) {
    await fetch(`/api/assignments/${assignmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    // Auto-update volunteer action status
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment) {
      const volunteerId = assignment.volunteer_id;
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

    void fetchAssignments();
  }

  const selectedRouteAssignments = useMemo(
    () => assignments.filter((a) => selectedRouteAssignmentIds.includes(a.id)),
    [assignments, selectedRouteAssignmentIds]
  );

  const selectedVolunteerId = selectedRouteAssignments[0]?.volunteer_id ?? null;
  const hasMixedVolunteers = selectedRouteAssignments.some(
    (a) => a.volunteer_id !== selectedVolunteerId
  );

  function toggleRouteAssignment(assignment: Assignment) {
    setRouteError(null);
    setSelectedRouteAssignmentIds((current) => {
      if (current.includes(assignment.id)) {
        return current.filter((id) => id !== assignment.id);
      }

      const firstSelected = assignments.find((a) => a.id === current[0]);
      if (firstSelected && firstSelected.volunteer_id !== assignment.volunteer_id) {
        setRouteError("A route can only include assignments for one volunteer at a time.");
        return current;
      }

      return [...current, assignment.id];
    });
  }

  async function createRoute() {
    setRouteError(null);

    if (!selectedVolunteerId || selectedRouteAssignmentIds.length === 0) {
      setRouteError("Select at least one assignment.");
      return;
    }

    if (hasMixedVolunteers) {
      setRouteError("A route can only include assignments for one volunteer at a time.");
      return;
    }

    setRouteCreating(true);
    const res = await fetch("/api/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        volunteer_id: selectedVolunteerId,
        assignment_ids: selectedRouteAssignmentIds,
        planned_date: plannedDate,
        name: routeName.trim() || undefined,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setRouteError(data?.error ?? "Could not create route.");
      setRouteCreating(false);
      return;
    }

    setSelectedRouteAssignmentIds([]);
    setRouteName("");
    setRouteCreating(false);
    router.push("/itineraries");
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
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Plan Route</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                  <div className="space-y-2">
                    <Label htmlFor="route_name">Route Name</Label>
                    <Input
                      id="route_name"
                      value={routeName}
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="planned_date">Date</Label>
                    <Input
                      id="planned_date"
                      type="date"
                      value={plannedDate}
                      onChange={(e) => setPlannedDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    size="sm"
                    onClick={createRoute}
                    disabled={
                      routeCreating ||
                      selectedRouteAssignmentIds.length === 0 ||
                      !plannedDate ||
                      hasMixedVolunteers
                    }
                  >
                    {routeCreating ? "Creating..." : "Create Route"}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {selectedRouteAssignmentIds.length} selected
                  </span>
                </div>
                {routeError && (
                  <p className="text-sm text-destructive">{routeError}</p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {active.map((a) => (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${a.cases.title} for route`}
                        checked={selectedRouteAssignmentIds.includes(a.id)}
                        onChange={() => toggleRouteAssignment(a)}
                        className="mt-1 h-4 w-4 rounded border-input accent-primary"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base">
                            {a.cases.title}
                          </CardTitle>
                          <Badge variant="secondary">{a.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {a.cases.location_label}
                        </p>
                      </div>
                    </div>
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
