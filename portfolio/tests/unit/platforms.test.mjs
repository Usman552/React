import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hirePlatforms, otherSocials, whatsappChatUrl, whatsappNumber } from "../../src/lib/platforms.js";

describe("marketplace links", () => {
  const socials = [
    { label: "GitHub", url: "https://github.com/Usman552" },
    { label: "Upwork", url: "https://www.upwork.com/freelancers/~01abc" },
    { label: "Fiverr", url: "https://www.fiverr.com/usman" },
  ];

  it("recognises Upwork and Fiverr", () => {
    assert.deepEqual(hirePlatforms(socials).map((p) => p.id), ["upwork", "fiverr"]);
    assert.deepEqual(otherSocials(socials).map((s) => s.label), ["GitHub"]);
  });

  it("ignores look-alike hosts and unsafe URLs", () => {
    assert.deepEqual(hirePlatforms([{ url: "https://upwork.com.evil.io/x" }, { url: "javascript:alert(1)" }]), []);
  });
});

describe("WhatsApp", () => {
  it("reads the number from wa.me and api.whatsapp.com links", () => {
    assert.equal(whatsappNumber([{ label: "WhatsApp", url: "https://wa.me/923001234567" }]), "923001234567");
    assert.equal(
      whatsappNumber([{ label: "WhatsApp", url: "https://api.whatsapp.com/send?phone=923001234567" }]),
      "923001234567"
    );
  });

  it("returns null without a WhatsApp link", () => {
    assert.equal(whatsappNumber([{ label: "GitHub", url: "https://github.com/x" }]), null);
    assert.equal(whatsappNumber([{ label: "WhatsApp", url: "https://wa.me/" }]), null);
  });

  it("opens a chat with a greeting already typed", () => {
    const url = new URL(whatsappChatUrl("923001234567", "Usman Qasim"));
    assert.equal(url.origin + url.pathname, "https://wa.me/923001234567");
    assert.equal(url.searchParams.get("text"), "Hi Usman! I saw your portfolio and would like to discuss a project.");
  });
});
