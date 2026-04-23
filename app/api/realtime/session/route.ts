import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(
    "https://api.openai.com/v1/realtime/client_secrets",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-realtime-mini",
        },
      }),
    },
  );

  if (!response.ok) {
    let errorMessage = "Failed to mint realtime session token";
    try {
      const errorData = await response.json();
      errorMessage = errorData?.error?.message ?? errorMessage;
    } catch {
      // ignore parse errors
    }
    return NextResponse.json({ error: errorMessage }, { status: 502 });
  }

  const data = await response.json();
  const token =
    typeof data?.value === "string"
      ? data.value
      : typeof data?.client_secret?.value === "string"
        ? data.client_secret.value
        : null;
  const expiresAt =
    typeof data?.expires_at === "number"
      ? data.expires_at
      : typeof data?.client_secret?.expires_at === "number"
        ? data.client_secret.expires_at
        : null;

  if (!token) {
    console.error("Unexpected realtime client secret response shape", {
      keys: data && typeof data === "object" ? Object.keys(data) : [],
    });
    return NextResponse.json(
      { error: "No client secret returned from OpenAI" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    token,
    expires_at: expiresAt,
  });
}
