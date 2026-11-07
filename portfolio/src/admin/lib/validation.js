// Client-side validation. The database enforces the same rules with CHECK
// constraints, so these exist for fast, friendly feedback, not for security.

export const URL_HINT = "Use a full https:// link, a /path on this site, or a #section.";

export function isSafeUrl(value) {
  if (value == null || value === "") return true;
  const url = String(value).trim();
  return (
    /^https?:\/\/[^\s<>"]+$/i.test(url) ||
    /^mailto:[^\s<>"]+$/i.test(url) ||
    /^#[A-Za-z0-9_-]*$/.test(url) ||
    url === "/" ||
    /^\/[^/\s<>"][^\s<>"]*$/.test(url)
  );
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
}

export function isSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || "") && value.length <= 80;
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Small rule runner: rules is { field: [ [testFn, message], ... ] }. */
export function runRules(values, rules) {
  const errors = {};
  for (const [field, checks] of Object.entries(rules)) {
    for (const [test, message] of checks) {
      if (!test(values[field], values)) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

export const required = (label) => [(v) => String(v ?? "").trim().length > 0, `${label} is required.`];
export const maxLen = (n) => [(v) => String(v ?? "").length <= n, `Keep it under ${n} characters.`];
export const safeUrlRule = [isSafeUrl, URL_HINT];

const wholeNumber = (min, max) => (v) =>
  v === "" || v == null || (Number.isInteger(Number(v)) && Number(v) >= min && Number(v) <= max);

export function validateProject(p) {
  return runRules(p, {
    title: [required("Title"), maxLen(120)],
    slug: [required("Slug"), [isSlug, "Use lowercase letters, numbers and dashes only."]],
    summary: [maxLen(400)],
    details: [maxLen(5000)],
    category: [required("Category"), maxLen(40)],
    demo_url: [safeUrlRule],
    repo_url: [safeUrlRule],
    thumbnail_url: [safeUrlRule],
  });
}

export function validateService(s) {
  return runRules(s, {
    title: [required("Title"), maxLen(100)],
    description: [maxLen(600)],
    icon: [required("Icon"), [(v) => [...String(v || "")].length <= 2, "Use one or two characters."]],
  });
}

export function validateSkillCategory(c) {
  return runRules(c, { title: [required("Title"), maxLen(80)], blurb: [maxLen(300)] });
}

export function validateSkill(s) {
  return runRules(s, {
    name: [required("Name"), maxLen(60)],
    level: [[wholeNumber(0, 100), "Use a whole number from 0 to 100, or leave it empty."]],
  });
}

export function validateProfile(p) {
  const errors = runRules(p, {
    name: [required("Name"), maxLen(80)],
    logo_text: [maxLen(30)],
    title: [maxLen(120)],
    hero_heading: [required("Hero heading"), maxLen(200)],
    hero_subtitle: [maxLen(600)],
    hero_badge: [maxLen(120)],
    availability_label: [maxLen(40)],
    location: [maxLen(80)],
    languages: [maxLen(80)],
    email: [[(v) => !v || isEmail(v), "Enter a valid email address."]],
    photo_url: [safeUrlRule],
    resume_url: [safeUrlRule],
    contact_intro: [maxLen(600)],
    experience_years: [[wholeNumber(0, 60), "Use a whole number from 0 to 60."]],
  });

  (p.socials || []).forEach((s, i) => {
    if (!s.label?.trim()) errors[`socials.${i}.label`] = "Label is required.";
    if (!/^https?:\/\//i.test(s.url || "") || !isSafeUrl(s.url)) errors[`socials.${i}.url`] = "Use a full https:// link.";
  });
  for (const key of ["cta_primary", "cta_secondary"]) {
    if (p[key]?.href && !isSafeUrl(p[key].href)) errors[`${key}.href`] = URL_HINT;
  }
  return errors;
}

export function validateSettings(s) {
  return runRules(s, {
    site_title: [maxLen(120)],
    seo_title: [maxLen(120)],
    seo_description: [maxLen(320)],
    seo_keywords: [maxLen(400)],
    og_image: [safeUrlRule],
    favicon_url: [safeUrlRule],
    footer_tagline: [maxLen(300)],
    footer_note: [maxLen(120)],
  });
}

export function validateExperience(e) {
  const errors = runRules(e, {
    title: [required("Title"), maxLen(120)],
    organization: [maxLen(120)],
    location: [maxLen(80)],
    employment_type: [maxLen(40)],
    description: [maxLen(1200)],
    credential_id: [maxLen(120)],
    url: [safeUrlRule],
    logo_url: [safeUrlRule],
  });
  if (e.start_date && e.end_date && !e.is_current && e.end_date < e.start_date) {
    errors.end_date = "The end date is before the start date.";
  }
  return errors;
}
