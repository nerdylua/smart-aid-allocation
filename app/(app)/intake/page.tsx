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
  { value: "mr", label: "Marathi" },
  { value: "ur", label: "Urdu" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "bn", label: "Bengali" },
  { value: "ml", label: "Malayalam" },
];

export default function IntakePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("en");
  const [incidentId, setIncidentId] = useState("");
  const [incidents, setIncidents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/incidents")
      .then((r) => r.json())
      .then((data) => setIncidents(data.filter((i: { status: string }) => i.status === "active" || i.status === "monitoring")))
      .catch(() => {});
  }, []);

  function applyTemplate(templateId: string) {
    const template = caseTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setTitle(template.defaults.title);
    if (template.defaults.needs) {
      setSelectedNeeds(template.defaults.needs.map((n) => n.type));
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
    } else {
      setLoading(false);
      alert("Failed to submit case. Please try again.");
    }
  }

  function toggleNeed(type: string) {
    setSelectedNeeds((prev) =>
      prev.includes(type) ? prev.filter((n) => n !== type) : [...prev, type]
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">New Case Intake</h2>
        <p className="text-muted-foreground">
          Submit a new need report from the field.
        </p>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {caseTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t.id)}
                className="px-3 py-1.5 rounded-full text-sm border bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
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
                onChange={(e) => setTitle(e.target.value)}
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
                <Select name="language" value={language} onValueChange={(v) => { if (v) setLanguage(v); }}>
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
            {incidents.length > 0 && (
              <div>
                <Label htmlFor="incident">Link to Incident (optional)</Label>
                <Select value={incidentId} onValueChange={(v) => setIncidentId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    {incidents.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
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
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    selectedNeeds.includes(type)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-transparent hover:border-primary/50"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            {selectedNeeds.map((type) => (
              <div key={type}>
                <Label htmlFor={`need_detail_${type}`}>
                  {type} — details (optional)
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
