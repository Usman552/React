import RichText from "./RichText";

/**
 * Editorial section heading: "(02) What I do", a large title, and an intro.
 * `split` puts the intro beside the title on wide screens.
 */
export default function SectionHead({ section, index, split = false, className = "" }) {
  return (
    <div className={`shead ${split && section.lead ? "shead--split" : ""} ${className}`}>
      <div>
        {section.label && (
          <p className="shead__label">
            {index && <span className="shead__index">({String(index).padStart(2, "0")})</span>}
            {section.label}
          </p>
        )}
        <h2 className="shead__title">
          <RichText text={section.title} />
        </h2>
      </div>
      {section.lead && <p className="shead__lead">{section.lead}</p>}
    </div>
  );
}
