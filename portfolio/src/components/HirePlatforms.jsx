import { hirePlatforms } from "../lib/platforms";
import "./HirePlatforms.css";

/** Small wordmarks so each button is recognisable at a glance. */
function Mark({ id }) {
  if (id === "upwork") return <span className="hire__mark hire__mark--upwork" aria-hidden="true">up</span>;
  if (id === "fiverr") return <span className="hire__mark hire__mark--fiverr" aria-hidden="true">fi</span>;
  return <span className="hire__mark" aria-hidden="true">↗</span>;
}

/**
 * "Hire me on Upwork" / "Order on Fiverr" buttons, built from the profile's
 * social links. Renders nothing when no marketplace link is set.
 *   variant="buttons"  large buttons (contact section, footer CTA)
 *   variant="inline"   one quiet line (hero)
 */
export default function HirePlatforms({ socials, variant = "buttons", label }) {
  const platforms = hirePlatforms(socials);
  if (!platforms.length) return null;

  if (variant === "inline") {
    return (
      <p className="hire-inline">
        {label || "Also available on"}
        {platforms.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="hire-inline__link">
            <Mark id={p.id} />
            {p.name}
          </a>
        ))}
      </p>
    );
  }

  return (
    <div className="hire">
      {label && <p className="hire__label">{label}</p>}
      <div className="hire__buttons">
        {platforms.map((p) => (
          <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className={`hire__btn hire__btn--${p.id}`}>
            <Mark id={p.id} />
            <span className="hire__text">
              <span className="hire__action">{p.action}</span>
              <span className="hire__sub">Secure payment via {p.name}</span>
            </span>
            <span className="hire__arrow" aria-hidden="true">
              ↗
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
