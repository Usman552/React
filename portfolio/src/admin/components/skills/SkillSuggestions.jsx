import { useMemo, useState } from "react";
import { Link } from "react-router";
import { discoverSkills, matchCategory, SKILL_GROUPS } from "../../../../supabase/functions/_shared/skills.js";
import { useToast } from "../../context/hooks";
import { api, nextSortOrder } from "../../lib/api";
import { describeError } from "../../lib/errors";
import { plural } from "../../lib/format";
import { supabase } from "../../lib/supabase";
import Icon from "../Icon";
import { Badge } from "../ui";

const PREVIEW = 6;
const NEW = "new:";

/**
 * Technologies found in the synced GitHub repositories that aren't skills
 * yet. Each one can be approved into a category (created on the fly if the
 * group has none) or dismissed so it stops being suggested.
 */
export default function SkillSuggestions({ data, setData }) {
  const toast = useToast();
  const [choice, setChoice] = useState({});
  const [busy, setBusy] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  const suggestions = useMemo(
    () => discoverSkills({ repos: data.repos, skills: data.skills, dismissed: data.dismissed }),
    [data.repos, data.skills, data.dismissed]
  );

  const targetFor = (s) => choice[s.key] ?? matchCategory(s.group, data.categories)?.id ?? `${NEW}${s.group}`;

  /** Returns the category id for `target`, creating the group's category if needed. */
  const ensureCategory = async (target, categories) => {
    if (!target.startsWith(NEW)) return { id: target, categories };
    const group = SKILL_GROUPS[target.slice(NEW.length)];
    const existing = categories.find((c) => c.title === group.title);
    if (existing) return { id: existing.id, categories };
    const created = await api.insert("skill_categories", {
      title: group.title,
      blurb: "",
      accent: group.accent,
      published: true,
      sort_order: nextSortOrder(categories),
    });
    return { id: created.id, categories: [...categories, created] };
  };

  const approve = async (list) => {
    setBusy(list.length === 1 ? list[0].key : "all");
    let categories = data.categories;
    let skills = data.skills;
    let added = 0;
    try {
      for (const s of list) {
        const resolved = await ensureCategory(targetFor(s), categories);
        categories = resolved.categories;
        const siblings = skills.filter((x) => x.category_id === resolved.id);
        const created = await api.insert("skills", {
          name: s.name,
          category_id: resolved.id,
          level: null,
          published: true,
          sort_order: nextSortOrder(siblings),
        });
        skills = [...skills, created];
        added += 1;
      }
      toast.success(list.length === 1 ? `${list[0].name} added to your skills.` : `${plural(added, "skill")} added.`);
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setData((d) => ({ ...d, categories, skills }));
      setBusy(null);
    }
  };

  const dismiss = async (s) => {
    setBusy(s.key);
    const { error } = await supabase.from("skill_suggestion_dismissals").upsert({ key: s.key, name: s.name });
    setBusy(null);
    if (error) {
      toast.error(describeError(error));
      return;
    }
    setData((d) => ({ ...d, dismissed: [...d.dismissed, { key: s.key, name: s.name }] }));
  };

  const restore = async (item) => {
    const { error } = await supabase.from("skill_suggestion_dismissals").delete().eq("key", item.key);
    if (error) {
      toast.error(describeError(error));
      return;
    }
    setData((d) => ({ ...d, dismissed: d.dismissed.filter((x) => x.key !== item.key) }));
  };

  if (!data.repos.length) {
    return (
      <section className="card card--muted">
        <div className="card__head">
          <div>
            <h2 className="card__title">
              <Icon name="wand" size={16} /> Discover skills from GitHub
            </h2>
            <p className="card__desc">Sync your repositories once and the technologies you use will be suggested here.</p>
          </div>
          <Link to="/admin/github" className="a-btn a-btn--ghost a-btn--sm">
            <Icon name="github" size={14} /> Connect GitHub
          </Link>
        </div>
      </section>
    );
  }

  const shown = expanded ? suggestions : suggestions.slice(0, PREVIEW);

  return (
    <section className="card suggest" id="discover">
      <div className="card__head">
        <div>
          <h2 className="card__title">
            <Icon name="wand" size={16} /> Discovered on GitHub
            {suggestions.length > 0 && <Badge tone="violet">{suggestions.length} new</Badge>}
          </h2>
          <p className="card__desc">
            Technologies used across {plural(data.repos.length, "repository", "repositories")} that aren&apos;t on your
            skills list yet. Nothing is added until you approve it.
          </p>
        </div>
        {suggestions.length > 1 && (
          <button type="button" className="a-btn a-btn--primary a-btn--sm" onClick={() => approve(suggestions)} disabled={Boolean(busy)}>
            <Icon name="check" size={14} /> {busy === "all" ? "Adding…" : `Add all ${suggestions.length}`}
          </button>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className="notice">
          <Icon name="check" size={16} /> Your skills cover every technology found in your repositories.
        </p>
      ) : (
        <ul className="suggest__list">
          {shown.map((s, i) => (
            <li key={s.key} className="suggest__row" style={{ "--i": i }}>
              <span className="suggest__name">
                {s.name}
                <Badge>{SKILL_GROUPS[s.group]?.label}</Badge>
              </span>
              <span className="suggest__repos" title={s.repos.join(", ")}>
                <span className="suggest__count">{plural(s.count, "repo")}</span> · {s.repos.slice(0, 3).join(", ")}
                {s.repos.length > 3 && "…"}
              </span>
              <label>
                <span className="sr-only">Category for {s.name}</span>
                <select
                  className="input input--sm"
                  value={targetFor(s)}
                  onChange={(e) => setChoice((c) => ({ ...c, [s.key]: e.target.value }))}
                >
                  {data.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                  {!matchCategory(s.group, data.categories) && (
                    <option value={`${NEW}${s.group}`}>+ New: {SKILL_GROUPS[s.group]?.title}</option>
                  )}
                </select>
              </label>
              <span className="row-actions">
                <button type="button" className="a-btn a-btn--soft a-btn--sm" onClick={() => approve([s])} disabled={Boolean(busy)}>
                  {busy === s.key ? "Adding…" : "Add"}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => dismiss(s)}
                  disabled={Boolean(busy)}
                  aria-label={`Dismiss ${s.name}`}
                  title="Don't suggest this again"
                >
                  <Icon name="x" size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="inline-actions">
        {suggestions.length > PREVIEW && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show fewer" : `Show all ${suggestions.length}`}
          </button>
        )}
        {data.dismissed.length > 0 && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => setShowDismissed((v) => !v)}>
            {showDismissed ? "Hide dismissed" : `Dismissed (${data.dismissed.length})`}
          </button>
        )}
      </div>

      {showDismissed && data.dismissed.length > 0 && (
        <div className="chips">
          {data.dismissed.map((d, i) => (
            <button key={d.key} type="button" className="chip" style={{ "--i": i }} onClick={() => restore(d)} title="Suggest again">
              {d.name} <Icon name="refresh" size={12} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
