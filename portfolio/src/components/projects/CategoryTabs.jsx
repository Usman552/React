/** "All · 3D Websites (3) · E-commerce (2)…" filter buttons. */
export default function CategoryTabs({ categories, total, active, onChange }) {
  const tabs = [{ name: null, label: "All", count: total }, ...categories.map((c) => ({ ...c, label: c.name }))];

  return (
    <div className="projects__filters" role="group" aria-label="Filter projects by category">
      {tabs.map((tab) => {
        const selected = (active || null) === tab.name;
        return (
          <button
            key={tab.label}
            type="button"
            aria-pressed={selected}
            className={`projects__filter ${selected ? "is-active" : ""}`}
            onClick={() => onChange(tab.name)}
          >
            {tab.label}
            <span className="projects__filter-count">{tab.count}</span>
          </button>
        );
      })}
    </div>
  );
}
