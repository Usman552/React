import { useState } from "react";
import { defaultSettings } from "../../data/defaults";
import { accentThemes } from "../../data/site";
import { normalizeTheme } from "../../lib/publicContent";
import Icon from "../components/Icon";
import { TextField, Toggle } from "../components/form";
import MediaUpload from "../components/MediaUpload";
import { Card, ErrorState, PageHeader, SaveBar, Skeleton } from "../components/ui";
import { useToast } from "../context/hooks";
import useForm from "../hooks/useForm";
import useLoad from "../hooks/useLoad";
import { api } from "../lib/api";
import { describeError } from "../lib/errors";
import { validateSettings } from "../lib/validation";

const SECTION_NAMES = {
  projects: "Projects",
  services: "Services",
  about: "About",
  experience: "Experience",
  skills: "Skills",
  contact: "Contact",
};
const EDITABLE = [
  "site_title", "seo_title", "seo_description", "seo_keywords", "og_image", "favicon_url",
  "footer_tagline", "footer_note", "sections", "project_display", "theme",
];

const MODES = [
  ["system", "monitor", "Match visitor's device"],
  ["dark", "moon", "Dark"],
  ["light", "sun", "Light"],
];

/** Fills in sections/display keys missing from older rows so every input is controlled. */
function withDefaults(row) {
  const values = Object.fromEntries(EDITABLE.map((k) => [k, row[k] ?? defaultSettings[k] ?? ""]));
  values.sections = Object.fromEntries(
    Object.keys(SECTION_NAMES).map((key) => [key, { ...defaultSettings.sections[key], ...(row.sections?.[key] || {}) }])
  );
  values.project_display = { ...defaultSettings.project_display, ...(row.project_display || {}) };
  values.theme = normalizeTheme(row.theme);
  return values;
}

function SettingsForm({ initial }) {
  const toast = useToast();
  const form = useForm(withDefaults(initial));
  const { values: v, bind, errors } = form;
  const [saving, setSaving] = useState(false);

  const setSection = (key, field) => (value) =>
    form.set("sections", { ...v.sections, [key]: { ...v.sections[key], [field]: value } });
  const setDisplay = (field) => (value) => form.set("project_display", { ...v.project_display, [field]: value });
  const setTheme = (field) => (value) => form.set("theme", { ...v.theme, [field]: value });
  const accent = accentThemes[v.theme.accent];
  const previewStyle = { "--preview-accent": accent.primary, "--preview-accent-2": accent.secondary };

  const submit = async (e) => {
    e.preventDefault();
    const found = validateSettings(v);
    form.setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...v,
        og_image: v.og_image || null,
        favicon_url: v.favicon_url || null,
        project_display: { ...v.project_display, initial_count: Number(v.project_display.initial_count) || 0 },
      };
      form.commit(withDefaults(await api.saveSettings(payload)));
      toast.success("Settings saved.");
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="form-stack" onSubmit={submit} noValidate>
      <Card
        title={
          <>
            <Icon name="palette" size={16} /> Appearance
          </>
        }
        description="How your public portfolio looks to visitors. The admin has its own light/dark switch in the top bar."
      >
        <div className="field">
          <span className="field__label">Default theme for new visitors</span>
          <div className="choice-grid" role="radiogroup" aria-label="Default theme">
            {MODES.map(([mode, icon, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={v.theme.mode === mode}
                className="choice"
                style={previewStyle}
                onClick={() => setTheme("mode")(mode)}
              >
                <span className={`choice__preview choice__preview--${mode}`} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
                <span className="choice__label">
                  <Icon name={icon} size={14} /> {label}
                </span>
              </button>
            ))}
          </div>
        </div>
        <Toggle
          label="Let visitors switch between light and dark"
          description={
            v.theme.allow_toggle
              ? "Shows the sun/moon switch in the menu. A visitor's choice is remembered on their device."
              : "The switch is hidden and everyone sees the default theme above."
          }
          checked={v.theme.allow_toggle}
          onChange={setTheme("allow_toggle")}
        />
        <div className="field">
          <span className="field__label">Brand colour</span>
          <div className="accent-grid" role="radiogroup" aria-label="Brand colour">
            {Object.entries(accentThemes).map(([key, preset]) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={v.theme.accent === key}
                className="accent"
                onClick={() => setTheme("accent")(key)}
              >
                <span
                  className="accent__dot"
                  style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                  aria-hidden="true"
                />
                {preset.label}
              </button>
            ))}
          </div>
          <p className="field__hint">Used for gradients, buttons, highlights and glows across the site.</p>
        </div>
      </Card>

      <Card
        title="Search and sharing"
        description="Applied in the browser on every visit. Social previews (WhatsApp, LinkedIn) read index.html, so they update after the next deploy."
      >
        <div className="form-grid">
          <TextField label="Site title" value={v.site_title} onChange={bind("site_title")} error={errors.site_title} max={120} />
          <TextField label="SEO title" hint="Browser tab and search result title." value={v.seo_title} onChange={bind("seo_title")} error={errors.seo_title} max={120} />
          <TextField className="span-2" label="SEO description" multiline rows={3} value={v.seo_description} onChange={bind("seo_description")} error={errors.seo_description} max={320} />
          <TextField className="span-2" label="Keywords" hint="Comma separated." value={v.seo_keywords} onChange={bind("seo_keywords")} error={errors.seo_keywords} max={400} />
          <MediaUpload label="Open Graph image" value={v.og_image} onChange={bind("og_image")} folder="seo" aspect="1.91 / 1" hint="1200×630 works best." />
          <MediaUpload
            label="Favicon"
            value={v.favicon_url}
            onChange={bind("favicon_url")}
            folder="seo"
            aspect="1 / 1"
            compact
            hint="Optional. Leave empty to keep the built-in favicon."
          />
        </div>
      </Card>

      <Card title="Sections" description="Show or hide sections and edit their headings. Use *stars* for gradient words.">
        <div className="sections-editor">
          {Object.entries(SECTION_NAMES).map(([key, name]) => {
            const section = v.sections[key];
            return (
              <fieldset key={key} className={`section-editor ${section.visible ? "" : "is-hidden"}`}>
                <legend className="sr-only">{name} section</legend>
                <Toggle label={name} description={section.visible ? "Visible" : "Hidden from the site and menu"} checked={section.visible} onChange={setSection(key, "visible")} />
                {section.visible && (
                  <div className="form-grid">
                    <TextField label="Label" value={section.label} onChange={setSection(key, "label")} max={40} />
                    <TextField label="Heading" value={section.title} onChange={setSection(key, "title")} max={160} />
                    <TextField className="span-2" label="Intro" multiline rows={2} value={section.lead} onChange={setSection(key, "lead")} max={400} />
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
      </Card>

      <Card title="Projects display">
        <Toggle
          label="Show category tabs"
          description="Lets visitors browse projects by category on the All projects page."
          checked={v.project_display.show_filters}
          onChange={setDisplay("show_filters")}
        />
        <Toggle
          label="Show 'Code' buttons"
          description="Off: visitors see live demos only, never source code links."
          checked={v.project_display.show_code_links}
          onChange={setDisplay("show_code_links")}
        />
        <Toggle
          label="Show 'More work on GitHub' link"
          description="Uses the GitHub link from your profile."
          checked={v.project_display.show_github_link}
          onChange={setDisplay("show_github_link")}
        />
        <TextField
          label="Projects on the home page"
          type="number"
          min={0}
          max={48}
          hint="The rest are on the All projects page. 0 shows every homepage project."
          value={v.project_display.initial_count}
          onChange={setDisplay("initial_count")}
        />
      </Card>

      <Card title="Footer">
        <div className="form-grid">
          <TextField className="span-2" label="Tagline" hint="New lines are kept." multiline rows={2} value={v.footer_tagline} onChange={bind("footer_tagline")} error={errors.footer_tagline} max={300} />
          <TextField label="Small print" value={v.footer_note} onChange={bind("footer_note")} error={errors.footer_note} max={120} />
        </div>
      </Card>

      <SaveBar dirty={form.dirty} saving={saving} onReset={form.reset} />
    </form>
  );
}

export default function SettingsPage() {
  const { data, loading, error, reload } = useLoad(api.getSettings);

  return (
    <>
      <PageHeader title="Settings" description="Appearance, SEO, section visibility, project display and footer." />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <Skeleton lines={6} />}
      {data && <SettingsForm initial={data} />}
    </>
  );
}
