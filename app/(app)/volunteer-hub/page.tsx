"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AvailableCase {
  id: string;
  title: string;
  description: string | null;
  location_label: string | null;
  language: string;
  needs: { type: string; detail?: string }[];
  assessments: { priority_score: number; severity: number; vulnerability: number }[];
}

const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "mr", label: "Marathi" },
  { value: "ur", label: "Urdu" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "ml", label: "Malayalam" },
];

export default function VolunteerHubPage() {
  const [cases, setCases] = useState<AvailableCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("all");
  const [expressing, setExpressing] = useState<string | null>(null);
  const [expressed, setExpressed] = useState<Set<string>>(new Set());

  async function fetchCases() {
    setLoading(true);
    const params = language !== "all" ? `?language=${language}` : "";
    const res = await fetch(`/api/cases/available${params}`);
    if (res.ok) setCases(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  async function expressInterest(caseId: string) {
    setExpressing(caseId);
    // In production, volunteer_id would come from auth context
    // For demo, use a placeholder
    const res = await fetch(`/api/cases/${caseId}/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteer_id: "demo-volunteer" }),
    });
    if (res.ok) {
      setExpressed((prev) => new Set(prev).add(caseId));
    }
    setExpressing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Find Cases</h2>
          <p className="text-muted-foreground">
            Browse available cases matching your skills. Express interest to get assigned.
          </p>
        </div>
        <div className="w-48">
          <Select value={language} onValueChange={(v) => { if (v) setLanguage(v); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading available cases...</p>}

      {!loading && cases.length === 0 && (
        <p className="text-sm text-muted-foreground">No available cases matching your criteria.</p>
      )}

      <div className="space-y-3">
        {cases.map((c) => {
          const assessment = c.assessments?.[0];
          return (
            <Card key={c.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {assessment && (
                      <span className={`text-xs font-mono ${assessment.severity >= 8 ? "text-red-600 font-bold" : assessment.severity >= 5 ? "text-orange-600" : ""}`}>
                        Severity {assessment.severity}/10
                      </span>
                    )}
                    <Badge variant="secondary">{c.language}</Badge>
                  </div>
                </div>
                {c.location_label && (
                  <p className="text-sm text-muted-foreground">{c.location_label}</p>
                )}
              </CardHeader>
              <CardContent>
                {c.description && (
                  <p className="text-sm mb-2">{c.description.slice(0, 150)}{c.description.length > 150 ? "..." : ""}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {c.needs.map((n, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {n.type}
                      </Badge>
                    ))}
                  </div>
                  {expressed.has(c.id) ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Interest Expressed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => expressInterest(c.id)}
                      disabled={expressing === c.id}
                    >
                      {expressing === c.id ? "Submitting..." : "I Can Help"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
