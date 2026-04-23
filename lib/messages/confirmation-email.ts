const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Sahaya <onboarding@resend.dev>";

export async function sendCaseConfirmationEmail(to: string, caseId: string) {
  const recipient = to.trim();
  if (!RESEND_API_KEY || !recipient || !recipient.includes("@")) return;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [recipient],
      subject: `Case Registered - ${caseId.slice(0, 8)}`,
      html: `<p>Thank you, your need has been registered.</p><p><strong>Case ID:</strong> ${caseId.slice(0, 8)}</p>`,
    }),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "");
    throw new Error(`Resend failed (${res.status}): ${details}`);
  }
}