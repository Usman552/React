/**
 * Tiny, safe inline formatting for editable text. No HTML is ever parsed.
 *
 *   **bold**      -> <strong>
 *   *highlight*   -> gradient text
 *   \n            -> line break
 *
 * Returns a flat list of tokens that RichText turns into React elements.
 */
export function parseInline(input) {
  const text = typeof input === "string" ? input : "";
  const tokens = [];
  const pattern = /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|\n/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) tokens.push({ type: "text", value: text.slice(last, match.index) });

    if (match[1] !== undefined) tokens.push({ type: "strong", value: match[1] });
    else if (match[2] !== undefined) tokens.push({ type: "highlight", value: match[2] });
    else tokens.push({ type: "break" });

    last = pattern.lastIndex;
  }

  if (last < text.length) tokens.push({ type: "text", value: text.slice(last) });
  return tokens;
}

/** The same text with formatting markers removed, for titles and aria labels. */
export function plainText(input) {
  return parseInline(input)
    .map((t) => (t.type === "break" ? " " : t.value))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
