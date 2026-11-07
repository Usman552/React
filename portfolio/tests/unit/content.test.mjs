import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInline, plainText } from "../../src/lib/text.js";
import { safeUrl } from "../../src/lib/url.js";

describe("parseInline", () => {
  it("parses highlight, bold and line breaks", () => {
    assert.deepEqual(parseInline("Hi —\nI build *fast* **apps**"), [
      { type: "text", value: "Hi —" },
      { type: "break" },
      { type: "text", value: "I build " },
      { type: "highlight", value: "fast" },
      { type: "text", value: " " },
      { type: "strong", value: "apps" },
    ]);
  });

  it("keeps HTML as plain text", () => {
    assert.deepEqual(parseInline("<img src=x onerror=alert(1)>"), [
      { type: "text", value: "<img src=x onerror=alert(1)>" },
    ]);
  });

  it("handles empty and non-string input", () => {
    assert.deepEqual(parseInline(""), []);
    assert.deepEqual(parseInline(null), []);
  });

  it("produces plain text for titles", () => {
    assert.equal(plainText("Selected *work*.\nNow"), "Selected work. Now");
  });
});

describe("safeUrl", () => {
  it("allows http(s), mailto, relative paths and anchors", () => {
    for (const url of ["https://a.com/x?y=1", "http://a.com", "mailto:me@a.com", "/resume.pdf", "#contact", "/"]) {
      assert.equal(safeUrl(url), url);
    }
  });

  it("blocks script and data URLs, protocol-relative and junk", () => {
    for (const url of ["javascript:alert(1)", " JAVASCRIPT:alert(1)", "data:text/html,x", "//evil.com", "a b", "", null, 5]) {
      assert.equal(safeUrl(url), null);
    }
  });
});
