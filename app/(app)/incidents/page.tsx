"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Incident {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  status: string;
  location_label: string | null;
  target_cases: number | null;
  started_at: string;
  case_count: number;
  cases_closed: number;
}

const statusColors: Record<string, string> = {
  active: "bg-red-100 text-red-800",
  monitoring: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchIncidents = useCallback(async () => {
    const res = await fetch("/api/incidents");
    if (res.ok) setIncidents(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchIncidents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchIncidents]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    const form = new FormData(e.currentTarget);
    await fetch("/api/incidents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        type: form.get("type") || null,
        description: form.get("description") || null,
        location_label: form.get("location_label") || null,
        target_cases: form.get("target_cases") ? Number(form.get("target_cases")) : null,
      }),
    });
    setCreating(false);
    setDialogOpen(false);
    void fetchIncidents();
  }

  if (loading) return <div className="text-muted-foreground">Loading incidents...</div>;

  const active = incidents.filter((i) => i.status === "active" || i.status === "monitoring");
  const past = incidents.filter((i) => i.status === "resolved" || i.status === "closed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
          <p className="text-muted-foreground">
            Group related cases under incidents for coordinated response.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button>New Incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Incident</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" placeholder="e.g. Dharavi Flooding 2026" required />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Input id="type" name="type" placeholder="flood, earthquake, fire..." />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location_label">Location</Label>
                  <Input id="location_label" name="location_label" placeholder="Area name" />
                </div>
                <div>
                  <Label htmlFor="target_cases">Target Households</Label>
                  <Input id="target_cases" name="target_cases" type="number" placeholder="Goal" />
                </div>
              </div>
              <Button type="submit" disabled={creating} className="w-full">
                {creating ? "Creating..." : "Create Incident"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Active ({active.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {active.map((i) => (
              <Link key={i.id} href={`/incidents/${i.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{i.name}</CardTitle>
                      <Badge variant="secondary" className={statusColors[i.status] ?? ""}>
                        {i.status}
                      </Badge>
                    </div>
                    {i.type && (
                      <p className="text-xs text-muted-foreground">{i.type} | {i.location_label}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-medium">{i.case_count} cases</span>
                      {i.target_cases && (
                        <span className="text-muted-foreground">
                          Target: {i.target_cases} | Progress: {Math.round((i.cases_closed / Math.max(i.target_cases, 1)) * 100)}%
                        </span>
                      )}
                    </div>
                    {i.target_cases && (
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min((i.cases_closed / i.target_cases) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Past ({past.length})</h3>
          {past.map((i) => (
            <Link key={i.id} href={`/incidents/${i.id}`}>
              <div className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50">
                <div>
                  <span className="font-medium text-sm">{i.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{i.case_count} cases</span>
                </div>
                <Badge variant="secondary" className={statusColors[i.status] ?? ""}>
                  {i.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {incidents.length === 0 && (
        <p className="text-sm text-muted-foreground">No incidents yet. Create one to group related cases.</p>
      )}
    </div>
  );
}
