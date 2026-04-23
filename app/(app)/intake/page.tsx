"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { caseTemplates } from "@/lib/case-templates";

const NEED_TYPES = [
  "medical",
  "food",
  "shelter",
  "water",
  "education",
  "counseling",
  "transport",
  "documentation",
  "sanitation",
  "supplies",
  "livelihood",
];

const LANGUAGES = [
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

const BATCH_SAMPLE = `title,description,location_label,language,needs,person_name,contact,family_size
Flooded home needs dry ration,Family displaced after overnight rain near low-lying lane,Shivajinagar,en,food|shelter,Asha,9845000001,5
Dialysis transport needed,Elderly resident needs urgent transport to hospital by afternoon,Whitefield,en,medical|transport,Ramesh,9845000002,2
Water shortage in relief cluster,Community kitchen reports shortage of drinking water,Electronic City,kn,water|supplies,Farida,9845000003,12`;

type BatchImportResponse = {
  created: number;
  geocoded: number;
  cases: { id: string; title: string }[];
};

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseBatchCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function buildBatchCases(csvText: string) {
  return parseBatchCsv(csvText)
    .map((row) => ({
      title: row.title,
      description: row.description || undefined,
      location_label: row.location_label || undefined,
      language: row.language || "en",
      needs: (row.needs || "")
        .split("|")
        .map((need) => need.trim())
        .filter(Boolean)
        .map((type) => ({ type })),
      person_info: {
        name: row.person_name || undefined,
        contact: row.contact || undefined,
        family_size: row.family_size ? Number(row.family_size) : undefined,
      },
    }))
    .filter((row) => row.title);
}

export default function IntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [incidentId, setIncidentId] = useState("");
  const [batchCsv, setBatchCsv] = useState("");
  const [batchResult, setBatchResult] = useState<BatchImportResponse | null>(
    null
  );
  const [incidents, setIncidents] = useState<{ id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) =>
        setIncidents(
          data.filter(
            (incident: { status: string }) =>
              incident.status === "active" || incident.status === "monitoring"
          )
        )
      )
      .catch(() => {});
  }, []);

  function applyTemplate(templateId: string) {
    const template = caseTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setTitle(template.defaults.title);
    if (template.defaults.needs) {
      setSelectedNeeds(template.defaults.needs.map((need) => need.type));
    }
    if ("language" in template.defaults && template.defaults.language) {
      setLanguage(template.defaults.language);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);

    const payload: Record<string, unknown> = {
      title: form.get("title"),
      description: form.get("description"),
      location_label: form.get("location_label"),
      language: form.get("language") || "en",
      source_channel: "form",
      ...(incidentId ? { incident_id: incidentId } : {}),
      needs: selectedNeeds.map((type) => ({
        type,
        detail: form.get(`need_detail_${type}`) || undefined,
      })),
      person_info: {
        name: form.get("person_name") || undefined,
        age: form.get("person_age") ? Number(form.get("person_age")) : undefined,
        gender: form.get("person_gender") || undefined,
        family_size: form.get("family_size")
          ? Number(form.get("family_size"))
          : undefined,
        contact: form.get("contact") || undefined,
      },
    };

    const res = await fetch("/api/intakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/cases/${data.id}`);
      return;
    }

    setLoading(false);
    alert("Failed to submit case. Please try again.");
  }

  async function handleBatchImport() {
    const cases = buildBatchCases(batchCsv);
    if (cases.length === 0) {
      alert("Please paste a CSV with at least one valid row.");
      return;
    }

    setBatchLoading(true);
    setBatchResult(null);

    const res = await fetch("/api/intakes/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cases }),
    });

    if (res.ok) {
      setBatchResult((await res.json()) as BatchImportResponse);
      setBatchLoading(false);
      return;
    }

    setBatchLoading(false);
    alert("Batch import failed. Check the CSV format and try again.");
  }

  function toggleNeed(type: string) {
    setSelectedNeeds((prev) =>
      prev.includes(type) ? prev.filter((need) => need !== type) : [...prev, type]
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Case Intake</h2>
        <p className="text-muted-foreground">
          Submit a new need report from the field.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {caseTemplates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template.id)}
                className="rounded-full border bg-muted px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {template.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Batch Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Paste CSV rows to register multiple Bengaluru cases at once. Imported
              locations are geocoded so they show up immediately on the hotspot map.
            </p>
            <p className="text-xs text-muted-foreground">
              Expected columns: title, description, location_label, language,
              needs, person_name, contact, family_size
            </p>
          </div>
          <Textarea
            value={batchCsv}
            onChange={(event) => setBatchCsv(event.target.value)}
            rows={7}
            placeholder="Paste CSV rows here..."
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBatchCsv(BATCH_SAMPLE)}
            >
              Fill Example
            </Button>
            <Button
              type="button"
              onClick={handleBatchImport}
              disabled={batchLoading}
            >
              {batchLoading ? "Importing..." : "Import Batch"}
            </Button>
            {batchResult?.cases?.[0] && (
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/cases/${batchResult.cases[0].id}`)}
              >
                Open First Imported Case
              </Button>
            )}
          </div>
          {batchResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              Imported {batchResult.created} cases. Geocoded {batchResult.geocoded}{" "}
              of them for the Bengaluru command map.
            </div>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Brief description of the need"
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed context about the situation..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location_label">Location</Label>
                <Input
                  id="location_label"
                  name="location_label"
                  placeholder="e.g. Koramangala, Bengaluru"
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  name="language"
                  value={language}
                  onValueChange={(value) => {
                    if (value) setLanguage(value);
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
            {incidents.length > 0 && (
              <div>
                <Label htmlFor="incident">Link to Incident (optional)</Label>
                <Select
                  value={incidentId}
                  onValueChange={(value) => setIncidentId(value ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidents.map((incident) => (
                      <SelectItem key={incident.id} value={incident.id}>
                        {incident.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Needs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {NEED_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleNeed(type)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selectedNeeds.includes(type)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {selectedNeeds.map((type) => (
              <div key={type}>
                <Label htmlFor={`need_detail_${type}`}>
                  {type} - details (optional)
                </Label>
                <Input
                  id={`need_detail_${type}`}
                  name={`need_detail_${type}`}
                  placeholder={`Specific ${type} needs...`}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Person / Household Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="person_name">Name</Label>
                <Input id="person_name" name="person_name" placeholder="Name" />
              </div>
              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input id="contact" name="contact" placeholder="Phone or address" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="person_age">Age</Label>
                <Input
                  id="person_age"
                  name="person_age"
                  type="number"
                  placeholder="Age"
                />
              </div>
              <div>
                <Label htmlFor="person_gender">Gender</Label>
                <Select name="person_gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="family_size">Family Size</Label>
                <Input
                  id="family_size"
                  name="family_size"
                  type="number"
                  placeholder="# people"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Submitting..." : "Submit Case"}
        </Button>
      </form>
    </div>
  );
}
