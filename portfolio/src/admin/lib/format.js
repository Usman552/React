const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

export function formatDateTime(value) {
  return value ? dateTime.format(new Date(value)) : "—";
}

export function formatDate(value) {
  return value ? dateOnly.format(new Date(value)) : "—";
}

/** "3 minutes ago", "yesterday", "in 2 hours"… */
export function timeAgo(value) {
  if (!value) return "never";
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function plural(count, word, pluralWord = `${word}s`) {
  return `${count} ${count === 1 ? word : pluralWord}`;
}

const monthYear = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric", timeZone: "UTC" });

/** "Mar 2024 — Present · 1 yr 4 mos" for an experience entry. */
export function formatPeriod({ start_date, end_date, is_current }) {
  const start = start_date ? monthYear.format(new Date(start_date)) : null;
  const end = is_current ? "Present" : end_date ? monthYear.format(new Date(end_date)) : null;
  const range = start && end ? `${start} — ${end}` : start || end || "";
  if (!start_date || (!end_date && !is_current)) return range;

  const from = new Date(start_date);
  const to = is_current ? new Date() : new Date(end_date);
  const months = Math.max(1, (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth() + 1);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  const length = [years && `${years} yr${years > 1 ? "s" : ""}`, rest && `${rest} mo${rest > 1 ? "s" : ""}`].filter(Boolean).join(" ");
  return `${range} · ${length}`;
}
