import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";
import { geocode } from "@/lib/geocode";

const MAX_BATCH_SIZE = 200;

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cases } = await request.json();

  if (!Array.isArray(cases) || cases.length === 0) {
    return NextResponse.json(
      { error: "cases array is required" },
      { status: 400 }
    );
  }

  if (cases.length > MAX_BATCH_SIZE) {
    return NextResponse.json(
      { error: `batch size exceeds limit of ${MAX_BATCH_SIZE}` },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  const inserts = cases.map((c: Record<string, unknown>) => ({
    title: c.title as string,
    description: (c.description as string) ?? null,
    org_id: (c.org_id as string) ?? null,
    source_channel: "csv" as const,
    location_label: (c.location_label as string) ?? null,
    needs: (c.needs as unknown[]) ?? [],
    person_info: (c.person_info as Record<string, unknown>) ?? {},
    language: (c.language as string) ?? "en",
    status: "new" as const,
  }));

  const { data, error } = await supabase
    .from("cases")
    .insert(inserts)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Batch audit events
  const auditInserts = (data ?? []).map((c: { id: string }) => ({
    entity_type: "case",
    entity_id: c.id,
    action: "created",
    metadata: { source_channel: "csv", batch: true },
  }));
  await supabase.from("audit_events").insert(auditInserts);

  const geocodedCases = await Promise.all(
    (data ?? []).map(async (createdCase: { id: string; location_label?: string | null }) => {
      if (!createdCase.location_label) return false;

      const query = createdCase.location_label.toLowerCase().includes("bengaluru")
        ? createdCase.location_label
        : `${createdCase.location_label}, Bengaluru, Karnataka, India`;

      const coords = await geocode(query).catch(() => null);
      if (!coords) return false;

      await supabase
        .from("cases")
        .update({
          location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` as unknown as null,
        })
        .eq("id", createdCase.id);

      return true;
    })
  );

  return NextResponse.json(
    {
      created: data?.length ?? 0,
      geocoded: geocodedCases.filter(Boolean).length,
      cases: data,
    },
    { status: 201 }
  );
}
