"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Message {
  id: string;
  channel: string;
  sender: string;
  body: string;
  status: string;
  promoted_case_id: string | null;
  created_at: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-muted-foreground">Loading messages...</div>;

  const pending = messages.filter((m) => m.status === "pending");
  const processed = messages.filter((m) => m.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Message Inbox</h2>
        <p className="text-muted-foreground">
          Email and multi-channel messages. {pending.length} pending review.
        </p>
      </div>

      {pending.length === 0 && processed.length === 0 && (
        <p className="text-sm text-muted-foreground">No messages yet. Send an email to the intake endpoint to start receiving messages.</p>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Pending ({pending.length})</h3>
          {pending.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">{m.sender}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{m.channel}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{m.body}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => promote(m.id)}>
                    Promote to Case
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => dismiss(m.id)}>
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
          {processed.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-mono mr-2">{m.sender}</span>
                <span className="text-sm text-muted-foreground truncate">
                  {m.body.slice(0, 60)}{m.body.length > 60 ? "..." : ""}
                </span>
              </div>
              <Badge
                variant="secondary"
                className={m.status === "promoted" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
              >
                {m.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
