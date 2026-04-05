"use client";

import { useRealtimeRefresh } from "@/hooks/use-realtime";

export function RealtimeRefresh() {
  useRealtimeRefresh(["cases", "assignments", "assessments"]);
  return null;
}
