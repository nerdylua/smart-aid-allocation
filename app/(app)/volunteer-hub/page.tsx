"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
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

interface VolunteerPersona {
  id: string;
  name: string;
  email: string;
  language: string;
  skills: string[];
  staffing: string | null;
  action: string | null;
}

const LANGUAGES = [
  { value: "all", label: "All Languages" },
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "kn", label: "Kannada" },
  { value: "mr", label: "Marathi" },
  { value: "ur", label: "Urdu" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "ml", label: "Malayalam" },
];

export default function VolunteerHubPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<AvailableCase[]>([]);
  const [volunteers, setVolunteers] = useState<VolunteerPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVolunteers, setLoadingVolunteers] = useState(true);
  const [language, setLanguage] = useState("all");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState("");
  const [expressing, setExpressing] = useState<string | null>(null);
  const [expressed, setExpressed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const loadCases = async () => {
      const params = language !== "all" ? `?language=${language}` : "";
      const res = await fetch(`/api/cases/available${params}`);
      if (!active) return;
      if (res.ok) {
        setCases((await res.json()) as AvailableCase[]);
      }
      setLoading(false);
    };

    void loadCases();

    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    let active = true;

    const loadVolunteers = async () => {
      const res = await fetch("/api/volunteers?available=true");
      if (!active) return;
      if (res.ok) {
        setVolunteers((await res.json()) as VolunteerPersona[]);
      }
      setLoadingVolunteers(false);
    };

    void loadVolunteers();

    return () => {
      active = false;
    };
  }, []);

  const autoVolunteerId =
    (user?.email
      ? volunteers.find((volunteer) => volunteer.email === user.email)?.id
      : null) ??
    volunteers[0]?.id ??
    "";
  const activeVolunteerId = selectedVolunteerId || autoVolunteerId;
  const selectedVolunteer =
    volunteers.find((volunteer) => volunteer.id === activeVolunteerId) ?? null;
  const isAuthenticatedVolunteer =
    Boolean(user?.email) && selectedVolunteer?.email === user?.email;

  async function expressInterest(caseId: string) {
    if (!activeVolunteerId) {
      alert("Select a volunteer identity before expressing interest.");
      return;
    }

    setExpressing(caseId);
    const res = await fetch(`/api/cases/${caseId}/interest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ volunteer_id: activeVolunteerId }),
    });
    if (res.ok) {
      setExpressed((prev) => new Set(prev).add(caseId));
    } else {
      alert("Unable to express interest right now. Please try again.");
    }
    setExpressing(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Find Cases</h2>
          <p className="text-muted-foreground">
            Browse available cases matching your skills. Express interest to get
            assigned.
          </p>
        </div>
        <div className="w-48">
          <Select
            value={language}
            onValueChange={(value) => {
              if (value) {
                setLoading(true);
                setLanguage(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Volunteer Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The hub now uses a real volunteer record instead of a placeholder, so
            interest signals create clean, demo-ready audit trails.
          </p>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Active volunteer persona</label>
              <Select
                value={activeVolunteerId}
                onValueChange={(value) => {
                  if (value) setSelectedVolunteerId(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingVolunteers
                        ? "Loading volunteers..."
                        : "Select volunteer"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {volunteers.map((volunteer) => (
                    <SelectItem key={volunteer.id} value={volunteer.id}>
                      {volunteer.name} - {volunteer.language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedVolunteer && (
              <Badge
                variant="secondary"
                className={
                  isAuthenticatedVolunteer
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }
              >
                {isAuthenticatedVolunteer
                  ? "Matched to signed-in volunteer"
                  : "Demo persona mode"}
              </Badge>
            )}
          </div>
          {selectedVolunteer && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{selectedVolunteer.name}</span>
                <span className="text-sm text-muted-foreground">
                  {selectedVolunteer.email}
                </span>
                <Badge variant="secondary">{selectedVolunteer.language}</Badge>
                {selectedVolunteer.staffing && (
                  <Badge variant="secondary">{selectedVolunteer.staffing}</Badge>
                )}
                {selectedVolunteer.action && (
                  <Badge variant="secondary">{selectedVolunteer.action}</Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedVolunteer.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading available cases...</p>
      )}

      {!loading && cases.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No available cases matching your criteria.
        </p>
      )}

      <div className="space-y-3">
        {cases.map((caseItem) => {
          const assessment = caseItem.assessments?.[0];
          return (
            <Card key={caseItem.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{caseItem.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {assessment && (
                      <span
                        className={`text-xs font-mono ${
                          assessment.severity >= 8
                            ? "font-bold text-red-600"
                            : assessment.severity >= 5
                              ? "text-orange-600"
                              : ""
                        }`}
                      >
                        Severity {assessment.severity}/10
                      </span>
                    )}
                    <Badge variant="secondary">{caseItem.language}</Badge>
                  </div>
                </div>
                {caseItem.location_label && (
                  <p className="text-sm text-muted-foreground">
                    {caseItem.location_label}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {caseItem.description && (
                  <p className="mb-2 text-sm">
                    {caseItem.description.slice(0, 150)}
                    {caseItem.description.length > 150 ? "..." : ""}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {caseItem.needs.map((need, index) => (
                      <Badge key={`${caseItem.id}-${need.type}-${index}`} variant="secondary" className="text-xs">
                        {need.type}
                      </Badge>
                    ))}
                  </div>
                  {expressed.has(caseItem.id) ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      Interest Expressed
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => expressInterest(caseItem.id)}
                      disabled={expressing === caseItem.id || !activeVolunteerId}
                    >
                      {expressing === caseItem.id ? "Submitting..." : "I Can Help"}
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
