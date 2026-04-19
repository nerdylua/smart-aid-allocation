"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CheckCircle2,
  ClipboardList,
  FilePlus2,
  FileText,
  Handshake,
  Loader2,
  Mic,
  MicOff,
  NotebookPen,
  StopCircle,
  Users,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SAHAYA_INSTRUCTIONS } from "@/lib/voice/instructions";
import { allVoiceTools } from "@/lib/voice/tools";

type Status = "idle" | "connecting" | "connected" | "error";

interface TranscriptLine {
  id: string;
  role: "user" | "assistant";
  text: string;
  streaming?: boolean;
}

interface ToolCallChip {
  id: string;
  name: string;
  done: boolean;
  startedAt: number;
  finishedAt?: number;
}

function extractLine(
  item: unknown,
  streamingDeltas: Map<string, string>
): TranscriptLine | null {
  if (typeof item !== "object" || item === null) return null;
  const candidate = item as Record<string, unknown>;

  if (candidate.type !== "message") return null;
  if (candidate.role === "system") return null;

  const itemId = typeof candidate.itemId === "string" ? candidate.itemId : "";
  const content = Array.isArray(candidate.content) ? candidate.content : [];
  let text = "";
  let isStreaming = false;

  for (const part of content as Record<string, unknown>[]) {
    if (part.type === "input_text" && typeof part.text === "string") {
      text += part.text;
    } else if (
      part.type === "input_audio" &&
      typeof part.transcript === "string" &&
      part.transcript
    ) {
      text += part.transcript;
    } else if (part.type === "output_text" && typeof part.text === "string") {
      text += part.text;
    } else if (part.type === "output_audio") {
      const historyTranscript =
        typeof part.transcript === "string" && part.transcript
          ? part.transcript
          : null;

      if (historyTranscript) {
        text += historyTranscript;
      } else {
        const liveText = itemId ? streamingDeltas.get(itemId) : undefined;
        if (liveText) {
          text += liveText;
          isStreaming = true;
        }
      }
    }
  }

  if (!text.trim()) return null;

  return {
    id: itemId || String(Math.random()),
    role: candidate.role === "user" ? "user" : "assistant",
    text: text.trim(),
    streaming: isStreaming,
  };
}

function statusLabel(status: Status) {
  if (status === "connecting") return "Connecting...";
  if (status === "connected") return "Connected";
  if (status === "error") return "Connection error";
  return "Ready";
}

function statusDot(status: Status) {
  if (status === "connected") return "bg-green-500";
  if (status === "connecting") return "bg-yellow-500 animate-pulse";
  if (status === "error") return "bg-red-500";
  return "bg-muted-foreground/40";
}

function formatToolLabel(name: string) {
  return name
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getToolIcon(name: string) {
  switch (name) {
    case "list_cases":
      return ClipboardList;
    case "get_case":
      return FileText;
    case "list_volunteers":
      return Users;
    case "create_intake":
      return FilePlus2;
    case "trigger_triage":
      return Brain;
    case "trigger_match":
      return Activity;
    case "create_assignment":
      return Handshake;
    case "add_case_note":
      return NotebookPen;
    default:
      return Activity;
  }
}

export function VoiceAgent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionRef = useRef<any>(null);
  const mountedRef = useRef(false);
  const startAttemptRef = useRef(0);
  const startAbortRef = useRef<AbortController | null>(null);
  const historyRef = useRef<unknown[]>([]);
  const streamingDeltasRef = useRef<Map<string, string>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCallChip[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [transcript]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      startAttemptRef.current += 1;
      startAbortRef.current?.abort();
      startAbortRef.current = null;

      if (sessionRef.current) {
        try {
          sessionRef.current.close();
        } catch {
          // ignore cleanup errors
        }
        sessionRef.current = null;
      }
    };
  }, []);

  const rebuildTranscript = useCallback(() => {
    const lines: TranscriptLine[] = [];
    for (const item of historyRef.current) {
      const line = extractLine(item, streamingDeltasRef.current);
      if (line) lines.push(line);
    }
    setTranscript(lines);
  }, []);

  const start = useCallback(async () => {
    startAbortRef.current?.abort();
    const abortController = new AbortController();
    const startAttempt = startAttemptRef.current + 1;
    startAttemptRef.current = startAttempt;
    startAbortRef.current = abortController;

    const isCurrentAttempt = () =>
      mountedRef.current &&
      startAttemptRef.current === startAttempt &&
      !abortController.signal.aborted;

    setStatus("connecting");
    setError(null);
    setTranscript([]);
    setToolCalls([]);
    historyRef.current = [];
    streamingDeltasRef.current = new Map();

    let session: typeof sessionRef.current | null = null;

    try {
      const tokenResponse = await fetch("/api/realtime/session", {
        method: "POST",
        credentials: "include",
        signal: abortController.signal,
      });
      if (!isCurrentAttempt()) return;

      if (!tokenResponse.ok) {
        const body = await tokenResponse.json().catch(() => ({}));
        throw new Error(
          body?.error ?? `Token request failed (${tokenResponse.status})`
        );
      }

      const { token } = await tokenResponse.json();
      if (!token) throw new Error("No token returned from session endpoint");
      if (!isCurrentAttempt()) return;

      const { RealtimeAgent, RealtimeSession } = await import(
        "@openai/agents/realtime"
      );
      if (!isCurrentAttempt()) return;

      const agent = new RealtimeAgent({
        name: "Sahaya Coordinator",
        instructions: SAHAYA_INSTRUCTIONS,
        tools: allVoiceTools,
      });

      session = new RealtimeSession(agent, {
        model: "gpt-realtime-mini",
      });

      if (!isCurrentAttempt()) {
        session.close();
        return;
      }

      sessionRef.current = session;

      session.on("history_updated", (history: unknown[]) => {
        if (!isCurrentAttempt()) return;

        historyRef.current = history;

        for (const item of history) {
          if (typeof item !== "object" || item === null) continue;
          const candidate = item as Record<string, unknown>;
          if (candidate.type !== "message" || candidate.role !== "assistant") {
            continue;
          }

          const itemId =
            typeof candidate.itemId === "string" ? candidate.itemId : "";
          if (!itemId) continue;

          const content = Array.isArray(candidate.content)
            ? candidate.content
            : [];

          for (const part of content as Record<string, unknown>[]) {
            if (
              part.type === "output_audio" &&
              typeof part.transcript === "string" &&
              part.transcript
            ) {
              streamingDeltasRef.current.delete(itemId);
              break;
            }
          }
        }

        rebuildTranscript();
      });

      session.on("transport_event", (event: unknown) => {
        if (!isCurrentAttempt()) return;
        if (typeof event !== "object" || event === null) return;

        const candidate = event as Record<string, unknown>;
        if (candidate.type === "response.output_audio_transcript.delta") {
          const itemId =
            typeof candidate.item_id === "string" ? candidate.item_id : "";
          const delta =
            typeof candidate.delta === "string" ? candidate.delta : "";

          if (itemId && delta) {
            const current = streamingDeltasRef.current.get(itemId) ?? "";
            streamingDeltasRef.current.set(itemId, current + delta);
            rebuildTranscript();
          }
        } else if (candidate.type === "response.output_audio_transcript.done") {
          const itemId =
            typeof candidate.item_id === "string" ? candidate.item_id : "";
          const finalText =
            typeof candidate.transcript === "string"
              ? candidate.transcript
              : "";

          if (itemId && finalText) {
            streamingDeltasRef.current.set(itemId, finalText);
            rebuildTranscript();
          }
        }
      });

      session.on("agent_tool_start", (...args: unknown[]) => {
        if (!isCurrentAttempt()) return;

        const toolDefinition = args[2] as { name: string };
        const toolId = `${toolDefinition.name}-${Date.now()}`;

        setToolCalls((previous) => [
          {
            id: toolId,
            name: toolDefinition.name,
            done: false,
            startedAt: Date.now(),
          },
          ...previous,
        ].slice(0, 3));
      });

      session.on("agent_tool_end", (...args: unknown[]) => {
        if (!isCurrentAttempt()) return;

        const toolDefinition = args[2] as { name: string };
        setToolCalls((previous) => {
          const lastPending = [...previous]
            .reverse()
            .find((tool) => tool.name === toolDefinition.name && !tool.done);

          if (!lastPending) return previous;

          return previous.map((tool) =>
            tool.id === lastPending.id
              ? { ...tool, done: true, finishedAt: Date.now() }
              : tool
          );
        });
      });

      session.on("error", (sessionError: unknown) => {
        if (!isCurrentAttempt()) return;

        const message =
          typeof sessionError === "object" && sessionError !== null
            ? String(
                (sessionError as Record<string, unknown>).error ??
                  JSON.stringify(sessionError)
              )
            : String(sessionError);

        console.error("[VoiceAgent] Session error:", sessionError);
        setError(message);
        setStatus("error");
      });

      await session.connect({ apiKey: token });

      if (!isCurrentAttempt()) {
        session.close();
        if (sessionRef.current === session) sessionRef.current = null;
        return;
      }

      startAbortRef.current = null;
      setStatus("connected");

      try {
        const transport = (session as unknown as Record<string, unknown>)
          .transport as { requestResponse?: () => void } | undefined;
        transport?.requestResponse?.();
      } catch {
        // non-fatal; the user can speak first
      }
    } catch (startError: unknown) {
      if (!isCurrentAttempt()) {
        if (session && sessionRef.current === session) {
          try {
            session.close();
          } catch {
            // ignore cleanup errors
          }
          sessionRef.current = null;
        }
        return;
      }

      const message =
        startError instanceof Error ? startError.message : String(startError);
      console.error("[VoiceAgent] Failed to start:", startError);
      setError(message);
      setStatus("error");
      startAbortRef.current = null;

      if (sessionRef.current && (!session || sessionRef.current === session)) {
        try {
          sessionRef.current.close();
        } catch {
          // ignore cleanup errors
        }
        sessionRef.current = null;
      }
    }
  }, [rebuildTranscript]);

  const stop = useCallback(() => {
    startAttemptRef.current += 1;
    startAbortRef.current?.abort();
    startAbortRef.current = null;

    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch {
        // ignore stop errors
      }
      sessionRef.current = null;
    }

    setStatus("idle");
    setMuted(false);
    setError(null);
  }, []);

  const toggleMute = useCallback(() => {
    if (!sessionRef.current) return;

    const nextMuted = !muted;
    try {
      sessionRef.current.mute(nextMuted);
      setMuted(nextMuted);
    } catch {
      // ignore mute errors
    }
  }, [muted]);

  const retry = useCallback(() => {
    setStatus("idle");
    setError(null);
    void start();
  }, [start]);

  const visibleToolCalls = toolCalls.slice(0, 3);
  const primaryToolCall = visibleToolCalls[0] ?? null;
  const secondaryToolCalls = visibleToolCalls.slice(1);
  const toolCallGridClass =
    secondaryToolCalls.length === 0
      ? "grid-cols-1"
      : secondaryToolCalls.length === 1
        ? "grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        : "grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,1fr)]";

  return (
    <div className="flex flex-col gap-3" style={{ height: 460 }}>
      <div className="flex min-h-8 items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${statusDot(status)}`}
          />
          <span className="text-sm text-muted-foreground">
            {statusLabel(status)}
          </span>
        </div>

        {status === "connected" && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="h-8 gap-1.5 px-2"
            >
              {muted ? (
                <MicOff className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Mic className="h-3.5 w-3.5 text-green-500" />
              )}
              <span className="text-xs">{muted ? "Unmute" : "Mute"}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="h-8 gap-1.5 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <StopCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Stop</span>
            </Button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-muted/40 p-3"
      >
        {transcript.length === 0 && status === "connected" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Wifi className="h-8 w-8 opacity-40" />
            <p className="text-sm">Listening... say something to Sahaya.</p>
          </div>
        )}

        {transcript.length === 0 && status === "idle" && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Mic className="h-8 w-8 opacity-30" />
            <p className="text-center text-sm">
              Press <strong>Start listening</strong> to activate the voice
              coordinator.
            </p>
          </div>
        )}

        {transcript.map((line) => (
          <div
            key={line.id}
            className={`flex ${
              line.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <span
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-relaxed ${
                line.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border/60 bg-background text-foreground"
              }`}
            >
              {line.text}
              {line.streaming && (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse align-middle opacity-70 bg-current" />
              )}
            </span>
          </div>
        ))}
      </div>

      {toolCalls.length > 0 && (
        <div className={`grid gap-2 pb-1 ${toolCallGridClass}`}>
          {primaryToolCall && (
            <div
              className={`min-w-0 rounded-2xl border px-3 py-2.5 ${
                primaryToolCall.done
                  ? "border-emerald-200/80 bg-emerald-500/8 dark:border-emerald-900/80"
                  : "border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/90">
                    {(() => {
                      const Icon = getToolIcon(primaryToolCall.name);
                      return (
                        <Icon
                          className={`h-4 w-4 ${
                            primaryToolCall.done
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-primary"
                          }`}
                        />
                      );
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      Latest tool
                    </p>
                    <p className="truncate text-sm font-medium">
                      {formatToolLabel(primaryToolCall.name)}
                    </p>
                  </div>
                </div>

                {primaryToolCall.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <div className="flex shrink-0 items-center gap-1.5 text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                  </div>
                )}
              </div>
            </div>
          )}

          {secondaryToolCalls.map((tool) => (
            <div
              key={tool.id}
              className={`flex min-w-0 flex-col justify-between rounded-2xl border px-3 py-2.5 ${
                tool.done
                  ? "border-emerald-200/80 bg-emerald-500/8 dark:border-emerald-900/80"
                  : "border-border/70 bg-background"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                {(() => {
                  const Icon = getToolIcon(tool.name);
                  return (
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tool.done
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  );
                })()}

                {tool.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="inline-flex items-center rounded-full bg-primary/8 px-1.5 py-0.5 text-[10px] text-primary">
                    Live
                  </span>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Recent
                </p>
                <p className="line-clamp-2 text-sm font-medium">
                  {formatToolLabel(tool.name)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {status === "idle" && (
        <Button onClick={start} className="w-full gap-2">
          <Mic className="h-4 w-4" />
          Start listening
        </Button>
      )}

      {status === "connecting" && (
        <Button disabled className="w-full gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      )}

      {status === "error" && (
        <Button onClick={retry} variant="outline" className="w-full gap-2">
          <Mic className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
