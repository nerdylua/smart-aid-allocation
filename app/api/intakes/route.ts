import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";
import { geocode } from "@/lib/geocode";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("cases")
    .insert({
      title: body.title,
      description: body.description ?? null,
      org_id: body.org_id ?? null,
      source_channel: body.source_channel ?? "form",
      location_label: body.location_label ?? null,
      needs: body.needs ?? [],
      person_info: body.person_info ?? {},
      language: body.language ?? "en",
      created_by: body.created_by ?? null,
      status: "new",
      ...(body.incident_id ? { incident_id: body.incident_id } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Geocode location if label provided but no coords.
  // Add city context for better hit accuracy on short neighborhood-only inputs.
  if (body.location_label && !body.location_coords) {
    const locationLabel = String(body.location_label).trim();
    const contextualQuery = /bengaluru|bangalore/i.test(locationLabel)
      ? locationLabel
      : `${locationLabel}, Bengaluru, Karnataka, India`;

    const coords =
      (await geocode(contextualQuery).catch(() => null)) ??
      (await geocode(locationLabel).catch(() => null));

    if (coords) {
      await supabase
        .from("cases")
        .update({
          location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` as unknown as null,
        })
        .eq("id", data.id);
    }
  }

  // Audit event
  await supabase.from("audit_events").insert({
    entity_type: "case",
    entity_id: data.id,
    action: "created",
    actor_id: body.created_by ?? null,
    metadata: { source_channel: body.source_channel ?? "form" },
  });

  return NextResponse.json(data, { status: 201 });
}
