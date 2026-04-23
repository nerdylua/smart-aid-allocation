"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  channel: string;
  sender: string;
  body: string;
  status: string;
  promoted_case_id: string | null;
  created_at: string;
}

const DEMO_EMAIL = {
  from: "field.coordinator@bengaluru-relief.org",
  subject: "Urgent water request from Marathahalli shelter cluster",
  body: "Community volunteer reports 18 families near Marathahalli bridge without clean drinking water since last night. Two elderly residents need immediate support and the shelter coordinator can be reached on 9845000012.",
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [emailForm, setEmailForm] = useState(DEMO_EMAIL);

  const fetchMessages = useCallback(async () => {
    const res = await fetch("/api/messages");
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMessages();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchMessages]);

  async function dismiss(id: string) {
    await fetch(`/api/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    void fetchMessages();
  }

  async function promote(id: string) {
    await fetch(`/api/messages/${id}/promote`, { method: "POST" });
    void fetchMessages();
  }

  async function simulateInboundEmail() {
    setSimulating(true);
    const res = await fetch("/api/intake/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailForm),
    });

    setSimulating(false);

    if (!res.ok) {
      alert("Unable to simulate inbound email right now.");
      return;
    }

    void fetchMessages();
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading messages...</div>;
  }

  const pending = messages.filter((message) => message.status === "pending");
  const processed = messages.filter((message) => message.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Message Inbox</h2>
        <p className="text-muted-foreground">
          Email and multi-channel messages. {pending.length} pending review.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulate Inbound Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use this demo console to create a fresh intake message, review it in
            the inbox, and then promote it into a triaged case live on stage.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                value={emailForm.from}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    from: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailForm.subject}
                onChange={(event) =>
                  setEmailForm((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              rows={5}
              value={emailForm.body}
              onChange={(event) =>
                setEmailForm((current) => ({
                  ...current,
                  body: event.target.value,
                }))
              }
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEmailForm(DEMO_EMAIL)}
            >
              Reset Example
            </Button>
            <Button
              type="button"
              onClick={simulateInboundEmail}
              disabled={simulating}
            >
              {simulating ? "Queuing..." : "Send to Inbox"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {pending.length === 0 && processed.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No messages yet. Use the simulator above to generate an intake message.
        </p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Pending ({pending.length})</h3>
          {pending.map((message) => (
            <Card key={message.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">
                    {message.sender}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{message.channel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm">{message.body}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => promote(message.id)}>
                    Promote to Case
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismiss(message.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {processed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Processed ({processed.length})</h3>
          {processed.map((message) => (
            <div
              key={message.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div className="min-w-0 flex-1">
                <span className="mr-2 text-sm font-mono">{message.sender}</span>
                <span className="truncate text-sm text-muted-foreground">
                  {message.body.slice(0, 60)}
                  {message.body.length > 60 ? "..." : ""}
                </span>
              </div>
              <Badge
                variant="secondary"
                className={
                  message.status === "promoted"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }
              >
                {message.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
