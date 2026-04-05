import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CaseDetailClient } from "./client";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: caseData, error } = await supabase
    .from("cases")
    .select("*, assessments(*), assignments(*, verifications(*))")
    .eq("id", id)
    .single();

  if (error || !caseData) notFound();

  return <CaseDetailClient caseData={caseData} />;
}
