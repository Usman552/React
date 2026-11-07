import { useCallback, useEffect, useState } from "react";
import Icon from "../components/Icon";
import { Badge, EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import { useConfirm, useToast } from "../context/hooks";
import { api } from "../lib/api";
import { describeError } from "../lib/errors";
import { formatDateTime, timeAgo } from "../lib/format";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 20;
const FILTERS = [
  ["inbox", "Inbox"],
  ["unread", "Unread"],
  ["contacted", "Contacted"],
  ["archived", "Archived"],
  ["all", "All"],
];
const TONES = { unread: "info", read: "neutral", contacted: "success", archived: "neutral" };

/** Strips characters that have meaning in PostgREST filter syntax. */
function sanitizeSearch(value) {
  return value.replace(/[,()*%\\]/g, " ").trim().slice(0, 80);
}

async function fetchMessages({ filter, query, page }) {
  let request = supabase
    .from("contact_messages")
    .select("id, name, email, message, status, created_at, read_at, contacted_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (filter === "inbox") request = request.in("status", ["unread", "read", "contacted"]);
  else if (filter !== "all") request = request.eq("status", filter);

  const q = sanitizeSearch(query);
  if (q) request = request.or(`name.ilike.*${q}*,email.ilike.*${q}*,message.ilike.*${q}*`);

  const { data, count, error } = await request;
  if (error) throw error;
  return { rows: data, count: count ?? 0 };
}

function notifyChanged() {
  window.dispatchEvent(new Event("admin:messages-changed"));
}

function MessageDetail({ message, onStatus, onDelete }) {
  if (!message) {
    return (
      <div className="inbox__detail inbox__detail--empty">
        <EmptyState icon="mail" title="Select a message" text="Pick a message on the left to read it." />
      </div>
    );
  }

  const reply = `mailto:${message.email}?subject=${encodeURIComponent("Re: your message")}`;

  return (
    <article className="inbox__detail" aria-labelledby="message-title">
      <header className="inbox__detail-head">
        <div>
          <h2 id="message-title" className="card__title">
            {message.name}
          </h2>
          <a className="link" href={`mailto:${message.email}`}>
            {message.email}
          </a>
          <p className="muted small">Received {formatDateTime(message.created_at)}</p>
        </div>
        <Badge tone={TONES[message.status]}>{message.status}</Badge>
      </header>

      <p className="inbox__message">{message.message}</p>

      <div className="inline-actions">
        <a className="a-btn a-btn--primary a-btn--sm" href={reply}>
          <Icon name="mail" size={14} /> Reply
        </a>
        {message.status !== "contacted" && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onStatus(message, "contacted")}>
            <Icon name="check" size={14} /> Mark contacted
          </button>
        )}
        {message.status !== "unread" && (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onStatus(message, "unread")}>
            Mark unread
          </button>
        )}
        {message.status === "archived" ? (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onStatus(message, "read")}>
            Move to inbox
          </button>
        ) : (
          <button type="button" className="a-btn a-btn--ghost a-btn--sm" onClick={() => onStatus(message, "archived")}>
            <Icon name="archive" size={14} /> Archive
          </button>
        )}
        <button type="button" className="a-btn a-btn--ghost a-btn--sm a-btn--danger-text" onClick={() => onDelete(message)}>
          <Icon name="trash" size={14} /> Delete
        </button>
      </div>

      {message.contacted_at && <p className="muted small">Marked contacted {timeAgo(message.contacted_at)}.</p>}
    </article>
  );
}

export default function MessagesPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState("inbox");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ key: null, rows: null, count: 0, error: null });
  const [selectedId, setSelectedId] = useState(null);

  // Debounce typing in the search box.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Each request is identified by its parameters; it's "loading" until the
  // stored result belongs to the current parameters.
  const requestKey = `${filter}|${search}|${page}|${version}`;
  const loading = state.key !== requestKey;

  useEffect(() => {
    let active = true;
    fetchMessages({ filter, query: search, page }).then(
      (result) => active && setState({ key: requestKey, ...result, error: null }),
      (err) => active && setState({ key: requestKey, rows: null, count: 0, error: describeError(err) })
    );
    return () => {
      active = false;
    };
  }, [filter, search, page, requestKey]);

  const load = useCallback(() => setVersion((v) => v + 1), []);

  const rows = state.rows || [];
  const selected = rows.find((m) => m.id === selectedId) || null;
  const pages = Math.max(1, Math.ceil(state.count / PAGE_SIZE));

  const updateLocal = (saved) =>
    setState((s) => ({ ...s, rows: s.rows.map((m) => (m.id === saved.id ? { ...m, ...saved } : m)) }));

  const setStatus = async (message, status, quiet = false) => {
    const now = new Date().toISOString();
    const values = { status };
    if (status === "read" && !message.read_at) values.read_at = now;
    if (status === "contacted") values.contacted_at = now;
    try {
      updateLocal(await api.update("contact_messages", message.id, values));
      notifyChanged();
      if (!quiet) toast.success(`Marked as ${status}.`);
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  const open = (message) => {
    setSelectedId(message.id);
    if (message.status === "unread") setStatus(message, "read", true);
  };

  const remove = async (message) => {
    const ok = await confirm({
      title: "Delete this message?",
      message: `The message from ${message.name} is removed permanently.`,
      confirmLabel: "Delete message",
      danger: true,
    });
    if (!ok) return;
    try {
      await api.remove("contact_messages", message.id);
      setSelectedId(null);
      notifyChanged();
      toast.success("Message deleted.");
      load();
    } catch (err) {
      toast.error(describeError(err));
    }
  };

  return (
    <>
      <PageHeader title="Messages" description="Enquiries from your contact form. Only admins can read them." />

      <div className="card card--flush">
        <div className="toolbar">
          <label className="search">
            <Icon name="search" size={16} />
            <span className="sr-only">Search messages</span>
            <input type="search" placeholder="Search name, email or message" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="segmented" role="group" aria-label="Filter messages">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                className={filter === key ? "is-active" : ""}
                onClick={() => {
                  setFilter(key);
                  setPage(1);
                  setSelectedId(null);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="toolbar__count">{state.count} total</span>
        </div>

        {state.error && <ErrorState message={state.error} onRetry={load} />}
        {loading && !state.rows && <Skeleton lines={6} height={40} />}

        {state.rows && rows.length === 0 && (
          <EmptyState
            icon="inbox"
            title={search ? "No messages match your search" : "No messages here"}
            text={search ? "Try a different search." : "New enquiries from the contact form will appear here."}
          />
        )}

        {rows.length > 0 && (
          <div className="inbox">
            <ul className="inbox__list" aria-label="Messages">
              {rows.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    className={`inbox__item ${m.id === selectedId ? "is-active" : ""} ${m.status === "unread" ? "is-unread" : ""}`}
                    onClick={() => open(m)}
                    aria-current={m.id === selectedId ? "true" : undefined}
                  >
                    <span className="inbox__row">
                      <strong>{m.name}</strong>
                      <time dateTime={m.created_at}>{timeAgo(m.created_at)}</time>
                    </span>
                    <span className="inbox__email">{m.email}</span>
                    <span className="inbox__preview">{m.message}</span>
                    {m.status !== "unread" && m.status !== "read" && <Badge tone={TONES[m.status]}>{m.status}</Badge>}
                  </button>
                </li>
              ))}
            </ul>
            <MessageDetail message={selected} onStatus={setStatus} onDelete={remove} />
          </div>
        )}

        {pages > 1 && (
          <nav className="pagination" aria-label="Pagination">
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {pages}
            </span>
            <button type="button" className="a-btn a-btn--ghost a-btn--sm" disabled={page === pages} onClick={() => setPage(page + 1)}>
              Next
            </button>
          </nav>
        )}
      </div>
    </>
  );
}
