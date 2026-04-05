"use client";

import { useEffect, useRef, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type TableName = "cases" | "assignments" | "assessments" | "case_notes";

export function useRealtimeRefresh(tables: TableName[]) {
  const router = useRouter();
  const supabaseRef = useRef(createBrowserClient());

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase.channel("realtime-refresh");

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        refresh
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tables, refresh]);
}

export function useRealtimeCase(caseId: string) {
  const router = useRouter();
  const supabaseRef = useRef(createBrowserClient());

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`case-${caseId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cases", filter: `id=eq.${caseId}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assignments", filter: `case_id=eq.${caseId}` },
        refresh
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "case_notes", filter: `case_id=eq.${caseId}` },
        refresh
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, refresh]);
}
