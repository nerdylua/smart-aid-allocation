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
    }
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

  return NextResponse.json({
    token: data.value,
    expires_at: data.expires_at,
  });
}
