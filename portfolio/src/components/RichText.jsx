import { Fragment } from "react";
import { parseInline } from "../lib/text";

/** Renders editable text with **bold**, *gradient* and line breaks. Never injects HTML. */
export default function RichText({ text }) {
  return parseInline(text).map((token, i) => {
    if (token.type === "break") return <br key={i} />;
    if (token.type === "strong") return <strong key={i}>{token.value}</strong>;
    if (token.type === "highlight") {
      return (
        <span key={i} className="hl">
          {token.value}
        </span>
      );
    }
    return <Fragment key={i}>{token.value}</Fragment>;
  });
}
