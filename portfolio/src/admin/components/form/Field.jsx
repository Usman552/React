export default function Field({ label, hint, error, children, id, className = "", count }) {
  return (
    <div className={`field ${error ? "has-error" : ""} ${className}`}>
      <div className="field__top">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {count}
      </div>
      {children}
      {error ? (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      ) : (
        hint && (
          <p className="field__hint" id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
