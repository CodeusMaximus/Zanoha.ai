"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Send,
  ShieldAlert,
  FileText,
  Trash2,
  Search,
  Plus,
  Paperclip,
  X,
  Reply,
  Archive,
  Star,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  Link2,
  List,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

type MailboxKey = "inbox" | "sent" | "spam" | "drafts" | "trash";

type ThreadItem = {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string; // header date string
  messageCount: number;
};

type ThreadMessage = {
  id: string;
  threadId: string;
  snippet: string;
  internalDate?: string;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  date: string;
  bodyText?: string;
  bodyHtml?: string;
};

type ThreadOpen = {
  id: string;
  messages: ThreadMessage[];
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function safeParseISOFromEmailDate(dateHeader: string) {
  // Gmail "Date" header is usually RFC 2822. new Date() generally parses it.
  const d = new Date(dateHeader);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return new Date().toISOString();
}

function formatDT(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function extractEmail(addrLine: string) {
  // "Name <email@x.com>" => email@x.com, else raw
  const m = addrLine.match(/<([^>]+)>/);
  return (m?.[1] || addrLine || "").trim();
}

function mailboxToLabel(m: MailboxKey) {
  switch (m) {
    case "inbox":
      return "INBOX";
    case "sent":
      return "SENT";
    case "spam":
      return "SPAM";
    case "drafts":
      return "DRAFT";
    case "trash":
      return "TRASH";
  }
}

export default function InboxPage() {
  // Dark mode observer (matches your app behavior)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // UI state
  const [mailbox, setMailbox] = useState<MailboxKey>("inbox");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Compose
  const [composeOpen, setComposeOpen] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [to, setTo] = useState("");
  const [cc, setCC] = useState("");
  const [bcc, setBCC] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Provider status + banners
  const [connected, setConnected] = useState<boolean | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Inbox data
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [openThread, setOpenThread] = useState<ThreadOpen | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const listAbortRef = useRef<AbortController | null>(null);
  const threadAbortRef = useRef<AbortController | null>(null);

  // Styling helpers
  const shell = cx(
    "min-h-[calc(100vh-64px)] flex flex-col transition-colors",
    isDark ? "bg-[#0b0f17] text-white" : "bg-neutral-50 text-neutral-900"
  );

  const panel = cx(
    "rounded-2xl border transition-colors",
    isDark ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-white"
  );

  const input = cx(
    "w-full rounded-xl border px-3 py-2 text-sm outline-none transition-colors",
    isDark
      ? "border-white/10 bg-white/5 text-white placeholder:text-zinc-500 focus:border-white/20"
      : "border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300"
  );

  const btn = (variant: "primary" | "ghost" | "danger") =>
    cx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition disabled:opacity-60 disabled:cursor-not-allowed",
      variant === "primary"
        ? isDark
          ? "bg-white/10 text-white ring-white/15 hover:bg-white/15"
          : "bg-neutral-900 text-white ring-neutral-900/10 hover:bg-neutral-800"
        : variant === "danger"
        ? isDark
          ? "bg-red-500/10 text-red-200 ring-red-500/20 hover:bg-red-500/15"
          : "bg-red-600 text-white ring-red-600/10 hover:bg-red-700"
        : isDark
        ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
        : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50"
    );

  const folders: Array<{ key: MailboxKey; label: string; icon: any; hint?: string }> = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "sent", label: "Sent", icon: Send },
    { key: "drafts", label: "Drafts", icon: FileText },
    { key: "spam", label: "Spam", icon: ShieldAlert },
    { key: "trash", label: "Trash", icon: Trash2 },
  ];

  // Gmail-ish widths
  const SIDEBAR_W = 260;
  const LIST_W = 360;

  // Fetch integration status on mount + after OAuth redirect query params
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const gmail = sp.get("gmail"); // e.g. gmail=connected
    const error = sp.get("error");

    if (error) setBanner({ type: "error", text: `Connection error: ${error}` });
    if (gmail === "connected") setBanner({ type: "success", text: "Gmail connected successfully." });

    if (gmail || error) {
      window.history.replaceState({}, "", window.location.pathname);
    }

    (async () => {
      try {
        const r = await fetch("/api/integrations/google/gmail/status", { cache: "no-store" });
        if (!r.ok) {
          setConnected(false);
          return;
        }
        const data = await r.json();
        setConnected(!!data.connected);
      } catch {
        setConnected(false);
      }
    })();
  }, []);

  async function fetchThreads(opts?: { append?: boolean; pageToken?: string | null }) {
    const append = !!opts?.append;
    const token = opts?.pageToken ?? null;

    // Cancel previous list request
    listAbortRef.current?.abort();
    const ac = new AbortController();
    listAbortRef.current = ac;

    if (!append) {
      setLoadingList(true);
      setListError(null);
      setThreads([]);
      setNextPageToken(null);
      setSelectedId(null);
      setOpenThread(null);
      setThreadError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const label = mailboxToLabel(mailbox);
      const params = new URLSearchParams();
      params.set("label", label);
      if (q.trim()) params.set("q", q.trim());
      params.set("max", "20");
      if (token) params.set("pageToken", token);

      const r = await fetch(`/api/gmail/threads?${params.toString()}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      if (r.status === 401) {
        setConnected(false);
        setListError("Gmail not connected for this tenant.");
        return;
      }
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        setListError(t || "Failed to load threads.");
        return;
      }

      const data = await r.json();
      const newThreads = (data.threads || []) as ThreadItem[];
      const next = (data.nextPageToken || null) as string | null;

      setThreads((prev) => (append ? [...prev, ...newThreads] : newThreads));
      setNextPageToken(next);

      // Auto-select first if none selected
      const firstId = (append ? null : newThreads[0]?.id) || null;
      if (!append && firstId) setSelectedId(firstId);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setListError(e?.message || "Failed to load threads.");
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  }

  async function fetchThread(threadId: string) {
    // Cancel previous thread request
    threadAbortRef.current?.abort();
    const ac = new AbortController();
    threadAbortRef.current = ac;

    setLoadingThread(true);
    setThreadError(null);
    setOpenThread(null);

    try {
      const r = await fetch(`/api/gmail/thread?id=${encodeURIComponent(threadId)}`, {
        cache: "no-store",
        signal: ac.signal,
      });

      if (r.status === 401) {
        setConnected(false);
        setThreadError("Gmail not connected for this tenant.");
        return;
      }
      if (!r.ok) {
        const t = await r.text().catch(() => "");
        setThreadError(t || "Failed to load thread.");
        return;
      }

      const data = await r.json();
      setOpenThread(data.thread as ThreadOpen);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      setThreadError(e?.message || "Failed to load thread.");
    } finally {
      setLoadingThread(false);
    }
  }

  // Load threads when mailbox or query changes (with small debounce)
  useEffect(() => {
    if (connected === false) return;

    const t = setTimeout(() => {
      fetchThreads({ append: false, pageToken: null });
    }, 250);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailbox, q, connected]);

  // When selection changes, load thread
  useEffect(() => {
    if (!selectedId) return;
    if (connected === false) return;
    fetchThread(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, connected]);

  // Counts (best-effort from what we have; accurate counts would need a counts endpoint)
  const counts = useMemo(() => {
    const c: Record<MailboxKey, number> = {
      inbox: 0,
      sent: 0,
      spam: 0,
      drafts: 0,
      trash: 0,
    };
    // We only have the current mailbox list in memory. Keep current box count as threads.length.
    c[mailbox] = threads.length;
    return c;
  }, [threads.length, mailbox]);

  const selectedMeta = useMemo(() => threads.find((t) => t.id === selectedId) || null, [threads, selectedId]);

  const lastMessage = useMemo(() => {
    const msgs = openThread?.messages || [];
    return msgs.length ? msgs[msgs.length - 1] : null;
  }, [openThread]);

  const replyTo = useMemo(() => {
    if (!lastMessage) return "";
    // If we're in sent box, replying would usually go to "to", else "from"
    return mailbox === "sent" ? extractEmail(lastMessage.to) : extractEmail(lastMessage.from);
  }, [lastMessage, mailbox]);

  async function onSend() {
    setSendError(null);

    const toVal = to.trim();
    const subjectVal = subject.trim();
    const bodyVal = body;

    if (!toVal || !subjectVal || !bodyVal.trim()) {
      setSendError("Missing To, Subject, or Body.");
      return;
    }

    setSending(true);
    try {
      const r = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toVal,
          subject: subjectVal,
          text: bodyVal,
          cc: cc.trim() || undefined,
          bcc: bcc.trim() || undefined,
        }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        const msg = data?.error || "Failed to send.";
        setSendError(msg);
        return;
      }

      setComposeOpen(false);
      setTo("");
      setCC("");
      setBCC("");
      setSubject("");
      setBody("");
      setShowCC(false);
      setShowBCC(false);

      setBanner({ type: "success", text: "Email sent." });

      // Refresh Sent box if you want
      // If user is currently on sent, reload it so the new message shows up (Gmail can be eventually consistent)
      if (mailbox === "sent") {
        fetchThreads({ append: false, pageToken: null });
      }
    } catch (e: any) {
      setSendError(e?.message || "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  function openCompose(opts?: { presetTo?: string; presetSubject?: string; presetBody?: string }) {
    setComposeOpen(true);
    if (opts?.presetTo !== undefined) setTo(opts.presetTo);
    if (opts?.presetSubject !== undefined) setSubject(opts.presetSubject);
    if (opts?.presetBody !== undefined) setBody(opts.presetBody);
  }

  // Header / stats actions
  const connectionStateLabel =
    connected === null ? "Checking…" : connected ? "Connected (Gmail)" : "Not Connected";

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8 flex flex-col flex-1">
        {/* Banner */}
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                banner.type === "success"
                  ? isDark
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : isDark
                  ? "border-red-500/20 bg-red-500/10 text-red-200"
                  : "border-red-200 bg-red-50 text-red-900"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>{banner.text}</div>
                <button
                  className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                    isDark ? "bg-white/5 hover:bg-white/10" : "bg-black/5 hover:bg-black/10"
                  }`}
                  onClick={() => setBanner(null)}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className={cx("text-3xl font-bold tracking-tight", isDark ? "text-white" : "text-neutral-900")}>
              Inbox
            </h1>
            <p className={cx("mt-2 text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>
              Gmail-backed inbox for this tenant. (Twilio SMS + more later.)
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span
                className={cx(
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                  connected
                    ? isDark
                      ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/20"
                      : "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : isDark
                    ? "bg-red-500/10 text-red-200 ring-red-500/20"
                    : "bg-red-50 text-red-900 ring-red-200"
                )}
              >
                {connected ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : <span className="h-2 w-2 rounded-full bg-red-400" />}
                {connectionStateLabel}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button className={btn("ghost")} onClick={() => openCompose()}>
              <Plus size={16} /> Compose
            </button>

            <button
              className={btn("ghost")}
              onClick={() => fetchThreads({ append: false, pageToken: null })}
              disabled={loadingList || connected === false}
              title="Refresh"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              className={btn(connected ? "ghost" : "primary")}
              onClick={() => {
                // match what you said is working for you
                window.location.href = "/api/google/oauth/start?purpose=gmail&next=/dashboard/IntegrationsPage";
              }}
            >
              {connected ? "Manage Connection" : "Connect Gmail"}
            </button>
          </div>
        </div>

        {/* If not connected */}
        {connected === false && (
          <div
            className={cx(
              "mt-6 rounded-2xl border p-5",
              isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white"
            )}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={isDark ? "text-amber-300" : "text-amber-600"} size={20} />
              <div className="min-w-0">
                <div className={cx("font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                  Gmail is not connected for this tenant
                </div>
                <div className={cx("mt-1 text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>
                  Click <b>Connect Gmail</b> above. Once connected, this inbox will populate with real threads.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Overview (kept) */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-5 gap-3">
          {folders.map((f) => {
            const Icon = f.icon;
            const count = counts[f.key];
            const isActive = mailbox === f.key;
            return (
              <button
                key={f.key}
                onClick={() => {
                  setMailbox(f.key);
                  setSelectedId(null);
                  setOpenThread(null);
                }}
                className={cx(
                  "rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? isDark
                      ? "border-white/20 bg-white/10 ring-2 ring-white/20"
                      : "border-neutral-300 bg-neutral-900 text-white ring-2 ring-neutral-900/20"
                    : isDark
                    ? "border-white/10 bg-white/[0.03] hover:bg-white/5"
                    : "border-neutral-200 bg-white hover:bg-neutral-50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} className={isActive ? "" : isDark ? "text-zinc-400" : "text-neutral-600"} />
                  <span className={cx("text-2xl font-bold", isActive ? "" : isDark ? "text-white" : "text-neutral-900")}>
                    {count}
                  </span>
                </div>
                <div className={cx("text-sm font-semibold", isActive ? "" : isDark ? "text-zinc-300" : "text-neutral-700")}>
                  {f.label}
                </div>
                {f.key === mailbox && (
                  <div className={cx("mt-1 text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>
                    Showing loaded count
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Main 3-pane layout */}
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          <div className={cx(panel, "overflow-hidden flex-1 flex flex-col")}>
            <div className="flex min-h-0 flex-1">
              {/* Left folder rail */}
              <aside
                className={cx("hidden lg:block shrink-0 border-r p-4", isDark ? "border-white/10" : "border-neutral-200")}
                style={{ width: SIDEBAR_W }}
              >
                <div className="space-y-1">
                  {folders.map((f) => {
                    const Icon = f.icon;
                    const active = mailbox === f.key;
                    return (
                      <button
                        key={f.key}
                        onClick={() => {
                          setMailbox(f.key);
                          setSelectedId(null);
                          setOpenThread(null);
                        }}
                        className={cx(
                          "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition",
                          active
                            ? isDark
                              ? "border-white/20 bg-white/10 text-white"
                              : "border-neutral-300 bg-neutral-900 text-white"
                            : isDark
                            ? "border-white/5 bg-white/0 text-zinc-300 hover:bg-white/5 hover:text-white"
                            : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon size={16} />
                          {f.label}
                        </span>
                        <span
                          className={cx(
                            "text-xs rounded-full px-2 py-0.5 ring-1",
                            isDark ? "bg-white/10 ring-white/10 text-zinc-200" : "bg-neutral-100 ring-neutral-200 text-neutral-700"
                          )}
                        >
                          {counts[f.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className={cx("mt-4 rounded-xl border p-3", isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50")}>
                  <div className={cx("text-xs font-semibold", isDark ? "text-zinc-200" : "text-neutral-800")}>Channels</div>
                  <div className={cx("mt-2 text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                    Gmail is live. Next: Twilio SMS + WhatsApp + internal notes.
                  </div>
                </div>
              </aside>

              {/* Middle list + reader */}
              <div className="flex min-w-0 flex-1">
                {/* List */}
                <div
                  className={cx("shrink-0 border-r flex flex-col", isDark ? "border-white/10" : "border-neutral-200")}
                  style={{ width: LIST_W }}
                >
                  <div className={cx("p-4 border-b", isDark ? "border-white/10" : "border-neutral-200")}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className={cx("text-sm font-semibold truncate", isDark ? "text-white" : "text-neutral-900")}>
                          {folders.find((f) => f.key === mailbox)?.label}
                        </div>
                        <div className={cx("text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                          {loadingList ? "Loading…" : `${threads.length} thread${threads.length === 1 ? "" : "s"}`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="relative">
                        <Search
                          size={16}
                          className={cx("absolute left-3 top-1/2 -translate-y-1/2", isDark ? "text-zinc-400" : "text-neutral-500")}
                        />
                        <input
                          className={cx(input, "pl-9")}
                          placeholder="Search Gmail…"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          disabled={connected === false}
                        />
                      </div>
                    </div>

                    {listError && (
                      <div
                        className={cx(
                          "mt-3 rounded-xl border px-3 py-2 text-xs",
                          isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-900"
                        )}
                      >
                        {listError}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto min-h-0">
                    {loadingList ? (
                      <div className={cx("p-6 text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>Loading threads…</div>
                    ) : threads.length === 0 ? (
                      <div className={cx("p-6 text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        {connected === false ? "Connect Gmail to load messages." : "No threads found."}
                      </div>
                    ) : (
                      <>
                        {threads.map((t) => {
                          const active = selectedId === t.id;
                          const dateISO = safeParseISOFromEmailDate(t.date || "");
                          return (
                            <button
                              key={t.id}
                              onClick={() => setSelectedId(t.id)}
                              className={cx(
                                "w-full text-left px-4 py-3 border-b transition",
                                isDark ? "border-white/10" : "border-neutral-200",
                                active ? (isDark ? "bg-white/10" : "bg-neutral-100") : isDark ? "hover:bg-white/[0.05]" : "hover:bg-neutral-50"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="h-2 w-2" />
                                    <div className={cx("truncate text-sm font-medium", isDark ? "text-white" : "text-neutral-900")}>
                                      {t.subject || "(no subject)"}
                                    </div>
                                  </div>

                                  <div className={cx("mt-1 truncate text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                                    {t.from || "(unknown sender)"}
                                  </div>

                                  <div className={cx("mt-1 truncate text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>
                                    {t.snippet || ""}
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                  <div className={cx("text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>{formatDT(dateISO)}</div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBanner({ type: "success", text: "Star toggle UI only (wire later)." });
                                    }}
                                    className={cx(
                                      "grid h-8 w-8 place-items-center rounded-lg ring-1 transition",
                                      isDark ? "bg-white/5 ring-white/10 hover:bg-white/10" : "bg-white ring-neutral-200 hover:bg-neutral-50"
                                    )}
                                    aria-label="Star"
                                  >
                                    <Star size={14} className={isDark ? "text-zinc-400" : "text-neutral-500"} />
                                  </button>
                                </div>
                              </div>
                            </button>
                          );
                        })}

                        <div className="p-4">
                          <button
                            className={cx(btn("ghost"), "w-full")}
                            disabled={!nextPageToken || loadingMore}
                            onClick={() => nextPageToken && fetchThreads({ append: true, pageToken: nextPageToken })}
                          >
                            {loadingMore ? "Loading…" : nextPageToken ? "Load more" : "No more"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Reader */}
                <div className="min-w-0 flex-1 flex flex-col">
                  <div
                    className={cx(
                      "px-4 py-3 border-b flex items-center justify-between",
                      isDark ? "border-white/10" : "border-neutral-200"
                    )}
                  >
                    <div className="min-w-0">
                      <div className={cx("truncate text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                        {selectedMeta?.subject || "Select a thread"}
                      </div>
                      {selectedMeta ? (
                        <div className={cx("mt-1 text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                          From: {selectedMeta.from || "-"} • To: {selectedMeta.to || "-"}
                        </div>
                      ) : (
                        <div className={cx("mt-1 text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>
                          Pick a thread to preview.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Archive UI only (wire later)." })} disabled={!selectedId}>
                        <Archive size={16} />
                        <span className="hidden sm:inline">Archive</span>
                      </button>
                      <button
                        className={btn("ghost")}
                        onClick={() => {
                          if (!lastMessage) return;
                          const baseSubj = lastMessage.subject || selectedMeta?.subject || "";
                          const re = baseSubj.toLowerCase().startsWith("re:") ? baseSubj : `Re: ${baseSubj}`;
                          openCompose({
                            presetTo: replyTo,
                            presetSubject: re,
                            presetBody: `\n\n---\n${lastMessage.bodyText || lastMessage.snippet || ""}`,
                          });
                        }}
                        disabled={!selectedId || !lastMessage}
                      >
                        <Reply size={16} />
                        <span className="hidden sm:inline">Reply</span>
                      </button>
                      <button className={cx(btn("ghost"), "px-3")} onClick={() => setBanner({ type: "success", text: "More actions later." })}>
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto min-h-0">
                    {threadError && (
                      <div
                        className={cx(
                          "mb-4 rounded-xl border px-3 py-2 text-xs",
                          isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-900"
                        )}
                      >
                        {threadError}
                      </div>
                    )}

                    {loadingThread ? (
                      <div className={cx("p-10 text-center text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        Loading thread…
                      </div>
                    ) : openThread && lastMessage ? (
                      <div className={cx("rounded-2xl border p-4", isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-white")}>
                        <div className={cx("text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                          {formatDT(safeParseISOFromEmailDate(lastMessage.date || ""))}
                        </div>

                        <div className={cx("mt-3 text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                          <div className="truncate">
                            <b>From:</b> {lastMessage.from || "-"}
                          </div>
                          <div className="truncate">
                            <b>To:</b> {lastMessage.to || "-"}
                          </div>
                          {!!lastMessage.cc && (
                            <div className="truncate">
                              <b>Cc:</b> {lastMessage.cc}
                            </div>
                          )}
                        </div>

                        {/* Prefer plain text. If only html exists, show it as text fallback to avoid unsafe rendering by default */}
                        <pre className={cx("mt-4 whitespace-pre-wrap text-sm leading-relaxed", isDark ? "text-zinc-100" : "text-neutral-800")}>
                          {lastMessage.bodyText?.trim()
                            ? lastMessage.bodyText
                            : lastMessage.bodyHtml?.trim()
                            ? lastMessage.bodyHtml
                                .replace(/<style[\s\S]*?<\/style>/gi, "")
                                .replace(/<script[\s\S]*?<\/script>/gi, "")
                                .replace(/<\/?[^>]+(>|$)/g, "")
                            : lastMessage.snippet || selectedMeta?.snippet || ""}
                        </pre>

                        {openThread.messages.length > 1 && (
                          <div className={cx("mt-5 text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>
                            Showing latest message • {openThread.messages.length} messages in thread
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={cx("p-10 text-center text-sm", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        No message selected.
                      </div>
                    )}

                    {/* AI Assist (kept) */}
                    <div className={cx("mt-4 rounded-2xl border p-4", isDark ? "border-white/10 bg-white/[0.03]" : "border-neutral-200 bg-neutral-50")}>
                      <div className={cx("text-sm font-semibold", isDark ? "text-white" : "text-neutral-900")}>AI Assist (later)</div>
                      <div className={cx("mt-1 text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        Summarize threads, draft replies, and suggest follow-ups using your Knowledge Base + MyReceptionist settings.
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "AI summary later." })}>
                          Summarize
                        </button>
                        <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "AI draft later." })}>
                          Draft reply
                        </button>
                        <button className={btn("primary")} onClick={() => openCompose()}>
                          Compose with AI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compose Modal */}
        <AnimatePresence>
          {composeOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setComposeOpen(false)}
              />
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <div
                  className={cx(
                    "w-full max-w-3xl overflow-hidden rounded-2xl border shadow-2xl",
                    isDark ? "border-white/10 bg-[#0a0e14]" : "border-neutral-200 bg-white"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className={cx("flex items-center justify-between px-5 py-4 border-b", isDark ? "border-white/10" : "border-neutral-200")}>
                    <div>
                      <div className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>Compose</div>
                      <div className={cx("text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        Sends via Gmail for this tenant.
                      </div>
                      {sendError && (
                        <div className={cx("mt-2 text-xs rounded-lg border px-2 py-1 inline-flex items-center gap-2", isDark ? "border-red-500/20 bg-red-500/10 text-red-200" : "border-red-200 bg-red-50 text-red-900")}>
                          <AlertTriangle size={14} /> {sendError}
                        </div>
                      )}
                    </div>

                    <button
                      className={cx(
                        "grid h-10 w-10 place-items-center rounded-xl ring-1 transition",
                        isDark ? "bg-white/5 ring-white/10 hover:bg-white/10" : "bg-neutral-50 ring-neutral-200 hover:bg-neutral-100"
                      )}
                      onClick={() => setComposeOpen(false)}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>To</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className={cx("text-xs underline", isDark ? "text-zinc-300" : "text-neutral-700")}
                              onClick={() => setShowCC((v) => !v)}
                            >
                              {showCC ? "Hide CC" : "CC"}
                            </button>
                            <button
                              type="button"
                              className={cx("text-xs underline", isDark ? "text-zinc-300" : "text-neutral-700")}
                              onClick={() => setShowBCC((v) => !v)}
                            >
                              {showBCC ? "Hide BCC" : "BCC"}
                            </button>
                          </div>
                        </div>
                        <input value={to} onChange={(e) => setTo(e.target.value)} className={input} placeholder="customer@email.com" />
                      </div>

                      {showCC && (
                        <div>
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>CC</label>
                          <input value={cc} onChange={(e) => setCC(e.target.value)} className={input} placeholder="cc@email.com" />
                        </div>
                      )}

                      {showBCC && (
                        <div>
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>BCC</label>
                          <input value={bcc} onChange={(e) => setBCC(e.target.value)} className={input} placeholder="bcc@email.com" />
                        </div>
                      )}

                      <div>
                        <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>Subject</label>
                        <input value={subject} onChange={(e) => setSubject(e.target.value)} className={input} placeholder="Subject line…" />
                      </div>
                    </div>

                    {/* Toolbar (UI only) */}
                    <div className={cx("flex flex-wrap items-center gap-2 rounded-xl border p-2", isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50")}>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <Bold size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <Italic size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <Underline size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <Link2 size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <List size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Formatting toolbar UI only." })}>
                        <ImageIcon size={16} />
                      </button>

                      <div className="flex-1" />

                      <button className={btn("ghost")} onClick={() => setBanner({ type: "success", text: "Attachments later (requires multipart + upload)." })}>
                        <Paperclip size={16} /> Attach
                      </button>
                    </div>

                    <textarea
                      className={cx(input, "min-h-[220px] resize-none")}
                      placeholder="Write your message…"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
                      <div className={cx("text-xs", isDark ? "text-zinc-500" : "text-neutral-500")}>
                        Sending is wired to <b>/api/gmail/send</b>. Drafts/labels next.
                      </div>

                      <div className="flex gap-2">
                        <button
                          className={btn("ghost")}
                          onClick={() => setBanner({ type: "success", text: "Save draft later (Gmail drafts endpoint)." })}
                          disabled
                          title="Next step: wire Gmail drafts"
                        >
                          Save draft
                        </button>
                        <button className={btn("primary")} onClick={onSend} disabled={sending || connected === false}>
                          {sending ? "Sending…" : "Send"}
                        </button>
                      </div>
                    </div>

                    {connected === false && (
                      <div className={cx("mt-2 text-xs", isDark ? "text-red-200" : "text-red-700")}>
                        Gmail is not connected for this tenant.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
