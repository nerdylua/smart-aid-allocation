"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useRealtimeCase } from "@/hooks/use-realtime";

interface Assessment {
  id: string;
  severity: number;
  vulnerability: number;
  confidence: number;
  freshness: number;
  priority_score: number;
  rationale: string;
  is_flagged: boolean;
  flagged_reason: string | null;
}

interface MatchCandidate {
  volunteer_id: string;
  volunteer_name: string;
  match_score: number;
  rationale: string;
  skills_matched: string[];
  language_match: boolean;
}

interface CaseNote {
  id: string;
  content: string;
  note_type: string;
  author_name: string | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CaseDetailClient({ caseData }: { caseData: any }) {
  const router = useRouter();
  const [triaging, setTriaging] = useState(false);
  const [matching, setMatching] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [matchResults, setMatchResults] = useState<MatchCandidate[] | null>(null);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [postingNote, setPostingNote] = useState(false);

  useRealtimeCase(caseData.id);

  const fetchNotes = useCallback(async () => {
    const res = await fetch(`/api/cases/${caseData.id}/notes`);
    if (res.ok) setNotes(await res.json());
  }, [caseData.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotes();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  async function addNote() {
    if (!newNote.trim()) return;
    setPostingNote(true);
    await fetch(`/api/cases/${caseData.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote, author_name: "Coordinator" }),
    });
    setNewNote("");
    setPostingNote(false);
    void fetchNotes();
  }

  const assessment: Assessment | null = caseData.assessments?.[0] ?? null;
  const needs = (caseData.needs ?? []) as { type: string; detail?: string }[];
  const personInfo = caseData.person_info ?? {};

  async function runTriage() {
    setTriaging(true);
    await fetch("/api/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseData.id }),
    });
    setTriaging(false);
    router.refresh();
  }

  async function runMatch() {
    setMatching(true);
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: caseData.id }),
    });
    const data = await res.json();
    setMatchResults(data.match?.candidates ?? []);
    setMatching(false);
  }

  async function dispatchVolunteer(candidate: MatchCandidate) {
    setDispatching(candidate.volunteer_id);
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: caseData.id,
        volunteerId: candidate.volunteer_id,
        matchRationale: candidate.rationale,
        matchScore: candidate.match_score,
      }),
    });
    setDispatching(null);
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{caseData.title}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{caseData.status.replace("_", " ")}</Badge>
            <span className="text-sm text-muted-foreground">
              {caseData.location_label} | {caseData.language}
            </span>
          </div>
        </div>
      </div>

      {caseData.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{caseData.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs</CardTitle>
          </CardHeader>
          <CardContent>
            {needs.length > 0 ? (
              <ul className="space-y-1">
                {needs.map((n, i) => (
                  <li key={i} className="text-sm">
                    <span className="font-medium">{n.type}</span>
                    {n.detail && (
                      <span className="text-muted-foreground"> — {n.detail}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No needs recorded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Person / Household</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="text-sm space-y-1">
              {personInfo.name && (
                <div>
                  <dt className="inline font-medium">Name:</dt>{" "}
                  <dd className="inline">{personInfo.name}</dd>
                </div>
              )}
              {personInfo.age && (
                <div>
                  <dt className="inline font-medium">Age:</dt>{" "}
                  <dd className="inline">{personInfo.age}</dd>
                </div>
              )}
              {personInfo.family_size && (
                <div>
                  <dt className="inline font-medium">Family size:</dt>{" "}
                  <dd className="inline">{personInfo.family_size}</dd>
                </div>
              )}
              {personInfo.vulnerabilities?.length > 0 && (
                <div>
                  <dt className="inline font-medium">Vulnerabilities:</dt>{" "}
                  <dd className="inline">
                    {personInfo.vulnerabilities.join(", ")}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Assessment Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">AI Triage Assessment</CardTitle>
          {!assessment && caseData.status === "new" && (
            <Button size="sm" onClick={runTriage} disabled={triaging}>
              {triaging ? "Running triage..." : "Run AI Triage"}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {assessment ? (
            <div className="space-y-3">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{assessment.severity}/10</div>
                  <div className="text-xs text-muted-foreground">Severity</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {assessment.vulnerability}/10
                  </div>
                  <div className="text-xs text-muted-foreground">Vulnerability</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {(assessment.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {assessment.priority_score.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground">Priority</div>
                </div>
              </div>
              {assessment.is_flagged && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-800">
                  Flagged: {assessment.flagged_reason}
                </div>
              )}
              <div className="text-sm bg-muted p-3 rounded-md">
                <strong>Rationale:</strong> {assessment.rationale}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No assessment yet. Run AI triage to score this case.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Matching Section */}
      {assessment && !caseData.assignments?.length && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Volunteer Matching</CardTitle>
            <Button size="sm" onClick={runMatch} disabled={matching}>
              {matching ? "Finding matches..." : "Find Volunteers"}
            </Button>
          </CardHeader>
          <CardContent>
            {matchResults ? (
              matchResults.length > 0 ? (
                <div className="space-y-3">
                  {matchResults.map((c, i) => (
                    <div
                      key={c.volunteer_id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div>
                        <div className="font-medium">
                          #{i + 1} {c.volunteer_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {c.rationale}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {c.skills_matched.map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs">
                              {s}
                            </Badge>
                          ))}
                          {c.language_match && (
                            <Badge variant="secondary" className="text-xs bg-green-100">
                              language match
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono">
                          {(c.match_score * 100).toFixed(0)}%
                        </span>
                        <Button
                          size="sm"
                          onClick={() => dispatchVolunteer(c)}
                          disabled={dispatching === c.volunteer_id}
                        >
                          {dispatching === c.volunteer_id
                            ? "Assigning..."
                            : "Assign"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No suitable volunteers found. Consider expanding search criteria.
                </p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Click &quot;Find Volunteers&quot; to run the AI matching agent.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assignments Section */}
      {caseData.assignments?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {caseData.assignments.map(
              (a: {
                id: string;
                status: string;
                match_rationale: string | null;
                match_score: number | null;
                volunteer_id: string;
                sla_deadline: string | null;
              }) => (
                <div key={a.id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{a.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {a.sla_deadline &&
                        `SLA: ${new Date(a.sla_deadline).toLocaleString()}`}
                    </span>
                  </div>
                  {a.match_rationale && (
                    <p className="text-sm mt-2 text-muted-foreground">
                      {a.match_rationale}
                    </p>
                  )}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length > 0 ? (
            <div className="space-y-3">
              {notes.map((note) => {
                const typeBadgeClass: Record<string, string> = {
                  comment: "bg-blue-100 text-blue-800",
                  status_change: "bg-yellow-100 text-yellow-800",
                  system: "bg-gray-100 text-gray-800",
                  escalation: "bg-red-100 text-red-800",
                };
                return (
                  <div key={note.id} className="flex gap-3 text-sm">
                    <div className="pt-0.5">
                      <Badge
                        variant="secondary"
                        className={`text-xs ${typeBadgeClass[note.note_type] ?? ""}`}
                      >
                        {note.note_type.replace("_", " ")}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p>{note.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {note.author_name ?? "Unknown"} &middot;{" "}
                        {new Date(note.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          )}

          <div className="flex gap-2 pt-2">
            <Textarea
              placeholder="Add a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={2}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={addNote}
              disabled={postingNote || !newNote.trim()}
              className="self-end"
            >
              {postingNote ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
