import { useState } from "react";
import { ListEditor, ParagraphsEditor, TagInput, TextField, Toggle } from "../components/form";
import MediaUpload from "../components/MediaUpload";
import { Card, ErrorState, PageHeader, SaveBar, Skeleton } from "../components/ui";
import { useToast } from "../context/hooks";
import useForm from "../hooks/useForm";
import useLoad from "../hooks/useLoad";
import { api } from "../lib/api";
import { describeError } from "../lib/errors";
import { validateProfile } from "../lib/validation";

const FORMAT_HINT = "Wrap words in *stars* for the gradient, **double stars** for bold. Use a new line for a break.";

/** Form values -> columns to update. id and updated_at are server-managed. */
function toPayload(v) {
  const clean = (list) => list.map((s) => s.trim()).filter(Boolean);
  const payload = {
    ...v,
    bio: clean(v.bio),
    experience_years: v.experience_years === "" || v.experience_years == null ? null : Number(v.experience_years),
    socials: v.socials.map((s) => ({ label: s.label.trim(), url: s.url.trim() })),
    stats: v.stats
      .filter((s) => s.label)
      .map((s) => ({ value: Number(s.value) || 0, suffix: s.suffix || "", label: s.label })),
    quick_facts: v.quick_facts.filter((f) => f.value && f.label),
  };
  delete payload.id;
  delete payload.updated_at;
  return payload;
}

function ProfileForm({ initial }) {
  const toast = useToast();
  const form = useForm(initial);
  const { values: v, bind, errors } = form;
  const [saving, setSaving] = useState(false);

  const setNested = (key, field) => (value) => form.set(key, { ...v[key], [field]: value });

  const submit = async (e) => {
    e.preventDefault();
    const found = validateProfile(v);
    form.setErrors(found);
    if (Object.keys(found).length) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    try {
      form.commit(await api.saveProfile(toPayload(v)));
      toast.success("Profile saved. The portfolio is updated.");
    } catch (err) {
      toast.error(describeError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="form-stack">
      <Card title="Identity" description="Your name and title as they appear across the site.">
        <div className="form-grid">
          <TextField label="Full name" value={v.name} onChange={bind("name")} error={errors.name} max={80} />
          <TextField label="Logo text" hint="Shown in the navbar and footer." value={v.logo_text} onChange={bind("logo_text")} error={errors.logo_text} max={30} />
          <TextField label="Professional title" value={v.title} onChange={bind("title")} error={errors.title} max={120} />
          <TextField label="Location" value={v.location} onChange={bind("location")} error={errors.location} max={80} />
          <TextField label="Languages" value={v.languages} onChange={bind("languages")} error={errors.languages} max={80} />
          <TextField
            label="Years of experience"
            type="number"
            min={0}
            max={60}
            hint="Optional. Shown in the About sidebar."
            value={v.experience_years ?? ""}
            onChange={bind("experience_years")}
            error={errors.experience_years}
          />
        </div>
      </Card>

      <Card title="Hero" description="The first screen visitors see.">
        <div className="form-grid">
          <TextField
            className="span-2"
            label="Heading"
            hint={FORMAT_HINT}
            multiline
            rows={2}
            value={v.hero_heading}
            onChange={bind("hero_heading")}
            error={errors.hero_heading}
            max={200}
          />
          <TextField className="span-2" label="Subtitle" multiline rows={3} value={v.hero_subtitle} onChange={bind("hero_subtitle")} error={errors.hero_subtitle} max={600} />
          <TagInput label="Rotating roles" hint="Typed out one after another under the heading." value={v.roles} onChange={bind("roles")} />
          <TagInput label="Floating tags" hint="Up to four chips around your photo." value={v.hero_tags} onChange={bind("hero_tags")} max={4} />
          <div className="span-2">
            <TagInput label="Marquee stack" hint="The scrolling technology strip under the hero." value={v.hero_stack} onChange={bind("hero_stack")} />
          </div>
          <TextField label="Primary button label" value={v.cta_primary.label} onChange={setNested("cta_primary", "label")} />
          <TextField label="Primary button link" value={v.cta_primary.href} onChange={setNested("cta_primary", "href")} error={errors["cta_primary.href"]} placeholder="#projects" />
          <TextField label="Secondary button label" value={v.cta_secondary.label} onChange={setNested("cta_secondary", "label")} />
          <TextField label="Secondary button link" value={v.cta_secondary.href} onChange={setNested("cta_secondary", "href")} error={errors["cta_secondary.href"]} placeholder="#contact" />
          <div className="span-2">
            <ListEditor
              label="Quick facts"
              hint="Short highlights under the buttons."
              items={v.quick_facts}
              onChange={bind("quick_facts")}
              fields={[
                { key: "value", label: "Value", placeholder: "10+", width: 1 },
                { key: "label", label: "Label", placeholder: "Projects shipped", width: 2 },
              ]}
              addLabel="Add fact"
              max={4}
            />
          </div>
        </div>
      </Card>

      <Card title="Availability">
        <Toggle
          label="Open to work"
          description="Shows a green pulse in the hero. Turn off to show an amber 'unavailable' state."
          checked={v.availability_open}
          onChange={bind("availability_open")}
        />
        <div className="form-grid">
          <TextField label="Hero badge text" value={v.hero_badge} onChange={bind("hero_badge")} error={errors.hero_badge} max={120} />
          <TextField label="Short status" hint="Shown in the About sidebar." value={v.availability_label} onChange={bind("availability_label")} error={errors.availability_label} max={40} />
        </div>
      </Card>

      <Card title="About" description="Biography, numbers and focus areas.">
        <ParagraphsEditor label="Biography" hint={FORMAT_HINT} value={v.bio} onChange={bind("bio")} />
        <ListEditor
          label="Stats"
          hint="Numbers count up when the section scrolls into view."
          items={v.stats}
          onChange={bind("stats")}
          fields={[
            { key: "value", label: "Number", type: "number", width: 1 },
            { key: "suffix", label: "Suffix", placeholder: "+", width: 1 },
            { key: "label", label: "Label", width: 3 },
          ]}
          addLabel="Add stat"
          max={6}
        />
        <TagInput label="What I focus on" value={v.focus} onChange={bind("focus")} max={10} />
      </Card>

      <Card title="Photo and resume">
        <div className="form-grid">
          <MediaUpload label="Profile photo" value={v.photo_url} onChange={bind("photo_url")} folder="profile" aspect="1 / 1" hint="Square images work best." />
          <div className="form-stack">
            <MediaUpload label="Resume / CV" kind="pdf" value={v.resume_url} onChange={bind("resume_url")} folder="resume" />
            <Toggle label="Show 'View Resume' button" checked={v.show_resume} onChange={bind("show_resume")} />
          </div>
        </div>
      </Card>

      <Card title="Contact details">
        <div className="form-grid">
          <TextField label="Contact email" type="email" value={v.email} onChange={bind("email")} error={errors.email} />
          <TextField label="Response time" value={v.response_time} onChange={bind("response_time")} max={80} />
          <TextField className="span-2" label="Contact intro" multiline rows={3} value={v.contact_intro} onChange={bind("contact_intro")} error={errors.contact_intro} max={600} />
        </div>
        <ListEditor
          label="Social profiles"
          hint="Add your Upwork or Fiverr profile here too: the site shows &quot;Hire me on Upwork&quot; / &quot;Order on Fiverr&quot; buttons for them automatically."
          items={v.socials}
          onChange={bind("socials")}
          errors={errors}
          errorKey="socials"
          fields={[
            { key: "label", label: "Label", placeholder: "GitHub", width: 1 },
            { key: "url", label: "URL", placeholder: "https://github.com/you", width: 3 },
          ]}
          addLabel="Add profile"
          max={8}
        />
      </Card>

      <SaveBar dirty={form.dirty} saving={saving} onReset={form.reset} />
    </form>
  );
}

export default function ProfilePage() {
  const { data, loading, error, reload } = useLoad(api.getProfile);

  return (
    <>
      <PageHeader title="Profile" description="Personal details, hero content and biography." />
      {error && <ErrorState message={error} onRetry={reload} />}
      {loading && <Skeleton lines={6} />}
      {data && <ProfileForm initial={data} />}
    </>
  );
}
