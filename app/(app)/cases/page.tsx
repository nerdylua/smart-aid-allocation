import { createServerClient } from "@/lib/supabase/server";
import { CaseQueue } from "@/components/case-queue";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const supabase = createServerClient();

  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, status, location_label, language, created_at, assessments(priority_score, severity, is_flagged)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">All Cases</h2>
        <p className="text-muted-foreground">
          Sorted by priority score. Click a case to view details and take action.
        </p>
      </div>
      <CaseQueue cases={(cases ?? []) as Array<{
        id: string;
        title: string;
        status: string;
        location_label: string | null;
        language: string;
        created_at: string;
        assessments: { priority_score: number; severity: number; is_flagged: boolean }[];
      }>} />
    </div>
  );
}
