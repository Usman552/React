import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildNotificationEmail, DEFAULT_FROM, sendNotification } from "../../supabase/functions/_shared/notify.js";

const message = { name: "Ali <script>", email: "ali@example.com", message: "Need a store.\n<b>Budget</b> 2k" };

describe("contact notification email", () => {
  it("lets the owner reply straight to the visitor", () => {
    const email = buildNotificationEmail(message, { to: "me@example.com" });
    assert.deepEqual(email.to, ["me@example.com"]);
    assert.equal(email.reply_to, "ali@example.com");
    assert.equal(email.from, DEFAULT_FROM);
    assert.match(email.subject, /^New enquiry from Ali/);
  });

  it("escapes visitor input in the HTML body", () => {
    const { html, text } = buildNotificationEmail(message, { to: "me@example.com" });
    assert.ok(!html.includes("<script>"));
    assert.ok(html.includes("Ali &lt;script&gt;"));
    assert.ok(html.includes("&lt;b&gt;Budget&lt;/b&gt;"));
    assert.ok(text.includes("<b>Budget</b>"), "the plain-text part keeps the original");
  });

  it("keeps the subject on one line", () => {
    const { subject } = buildNotificationEmail({ ...message, name: "Ali\r\nBcc: x@y.z" }, { to: "me@example.com" });
    assert.ok(!/[\r\n]/.test(subject));
  });

  it("is skipped without configuration and never throws", async () => {
    assert.deepEqual(await sendNotification(message, { apiKey: "", to: "me@example.com" }), { ok: false, skipped: true });

    const failing = await sendNotification(message, {
      apiKey: "key",
      to: "me@example.com",
      fetchImpl: async () => Promise.reject(new Error("offline")),
    });
    assert.deepEqual(failing, { ok: false, error: "offline" });
  });

  it("posts to Resend with the API key", async () => {
    let request;
    const result = await sendNotification(message, {
      apiKey: "re_123",
      to: "me@example.com",
      fetchImpl: async (url, init) => {
        request = { url, init };
        return new Response("{}", { status: 200 });
      },
    });
    assert.equal(result.ok, true);
    assert.equal(request.url, "https://api.resend.com/emails");
    assert.equal(request.init.headers.Authorization, "Bearer re_123");
    assert.equal(JSON.parse(request.init.body).reply_to, "ali@example.com");
  });
});
