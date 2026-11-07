// Email notification for new contact messages, sent through Resend
// (https://resend.com, free tier). Plain JS so the Node tests can check it.
//
// Enabled by two Edge Function secrets:
//   RESEND_API_KEY  API key from resend.com
//   NOTIFY_EMAIL    where to send it (the email you signed up to Resend with)
// Optional:
//   NOTIFY_FROM     sender; defaults to Resend's shared test sender, which can
//                   deliver to your own Resend account email without a domain.

export const DEFAULT_FROM = "Portfolio <onboarding@resend.dev>";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Builds the Resend payload. Reply-To is the visitor, so "Reply" answers them. */
export function buildNotificationEmail({ name, email, message }, { to, from = DEFAULT_FROM }) {
  const subject = `New enquiry from ${name}`.slice(0, 120).replace(/[\r\n]+/g, " ");
  const text = `${message}\n\n—\n${name} <${email}>\n\nReply to this email to answer them directly.`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:560px;color:#111">
      <p style="margin:0 0 4px;font-size:13px;color:#666">New message from your portfolio</p>
      <h2 style="margin:0 0 16px;font-size:20px">${escapeHtml(name)}</h2>
      <p style="margin:0 0 16px"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
      <div style="white-space:pre-wrap;line-height:1.6;padding:16px;border-radius:10px;background:#f4f4f6">${escapeHtml(message)}</div>
      <p style="margin:16px 0 0;font-size:13px;color:#666">Reply to this email to answer ${escapeHtml(name)} directly.</p>
    </div>`;

  return { from, to: [to], reply_to: email, subject, text, html };
}

/**
 * Sends the notification. Never throws: a failed email must not lose the
 * message, which is already saved and visible in Admin → Messages.
 */
export async function sendNotification(message, { apiKey, to, from, fetchImpl = fetch, timeoutMs = 5000 }) {
  if (!apiKey || !to) return { ok: false, skipped: true };
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildNotificationEmail(message, { to, from: from || DEFAULT_FROM })),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { ok: false, error: `Resend responded with ${res.status}: ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
