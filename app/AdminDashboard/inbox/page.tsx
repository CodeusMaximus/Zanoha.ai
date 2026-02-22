 "use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

type MailboxKey = "inbox" | "sent" | "spam" | "drafts" | "trash";

type Message = {
  id: string;
  mailbox: MailboxKey;
  from: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  dateISO: string;
  unread?: boolean;
  starred?: boolean;
};

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

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function InboxPage() {
  // Dark mode observer (matches your app behavior)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  // UI state
  const [mailbox, setMailbox] = useState<MailboxKey>("inbox");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);

  // Compose fields (UI only)
  const [to, setTo] = useState("");
  const [cc, setCC] = useState("");
  const [bcc, setBCC] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  // Dummy data (replace later with real providers)
  const messages: Message[] = useMemo(
    () => [
      // INBOX MESSAGES
      {
        id: "m1",
        mailbox: "inbox",
        from: "Appointments <booking@freshfade.com>",
        to: "you@tenant.com",
        subject: "New booking confirmed — 3:30pm",
        preview: "Customer confirmed appointment. Notes: wants beard trim…",
        body:
          "Hey!\n\nYour customer confirmed their appointment for today at 3:30pm.\n\nNotes: wants a beard trim + lineup.\n\n— Receptionist CRM",
        dateISO: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: false,
      },
      {
        id: "m2",
        mailbox: "inbox",
        from: "Twilio <no-reply@twilio.com>",
        to: "you@tenant.com",
        subject: "Missed call — follow up?",
        preview: "You missed a call at 11:04am from +1 (917)…",
        body:
          "You missed a call at 11:04am from +1 (917) 555-0131.\n\nTip: Send an SMS follow-up or start an outbound call campaign.",
        dateISO: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: true,
      },
      {
        id: "m6",
        mailbox: "inbox",
        from: "Sarah Martinez <sarah.m@email.com>",
        to: "you@tenant.com",
        subject: "Question about pricing packages",
        preview: "Hi! I'm interested in your premium package but had a few…",
        body:
          "Hi!\n\nI'm interested in your premium package but had a few questions:\n\n1. Does it include the styling consultation?\n2. What's the cancellation policy?\n3. Can I book recurring appointments?\n\nLooking forward to hearing from you!\n\nBest,\nSarah",
        dateISO: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: false,
      },
      {
        id: "m7",
        mailbox: "inbox",
        from: "Marcus Johnson <m.johnson@company.com>",
        to: "you@tenant.com",
        subject: "Reschedule request for tomorrow",
        preview: "Hey, something came up at work. Can we move my 2pm to…",
        body:
          "Hey,\n\nSomething came up at work. Can we move my 2pm tomorrow to either Wednesday afternoon or Thursday morning?\n\nSorry for the short notice!\n\nMarcus",
        dateISO: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: false,
      },
      {
        id: "m8",
        mailbox: "inbox",
        from: "LinkedIn <notifications@linkedin.com>",
        to: "you@tenant.com",
        subject: "5 people viewed your profile this week",
        preview: "Your profile is getting noticed! See who's checking you out…",
        body:
          "Hi there,\n\nYour profile has been viewed 5 times this week. Boost your visibility by:\n\n• Adding more skills\n• Sharing industry insights\n• Engaging with your network\n\nView your profile analytics →",
        dateISO: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
      },
      {
        id: "m9",
        mailbox: "inbox",
        from: "Stripe <receipts@stripe.com>",
        to: "you@tenant.com",
        subject: "Payment received - $149.00",
        preview: "You've received a payment of $149.00 from Julia Chen",
        body:
          "Payment Received\n\nAmount: $149.00\nFrom: Julia Chen\nDate: Jan 24, 2026\nStatus: Completed\n\nThis payment will be deposited to your bank account within 2 business days.\n\nView transaction details →",
        dateISO: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: true,
      },
      {
        id: "m10",
        mailbox: "inbox",
        from: "Alex Rivera <alex.r@email.com>",
        to: "you@tenant.com",
        subject: "First-time client - need advice",
        preview: "Hi! I've never had a professional cut before and I'm nervous…",
        body:
          "Hi!\n\nI've never had a professional cut before and I'm pretty nervous. I have really thick curly hair and most people mess it up.\n\nDo you have experience with curly hair? What would you recommend for a first visit?\n\nThanks,\nAlex",
        dateISO: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        unread: true,
        starred: false,
      },
      {
        id: "m11",
        mailbox: "inbox",
        from: "Google Calendar <calendar-notification@google.com>",
        to: "you@tenant.com",
        subject: "Reminder: Client meeting in 1 hour",
        preview: "You have an event starting at 2:00 PM",
        body:
          "Reminder: Client consultation\n\nWhen: Today at 2:00 PM\nWhere: Main Studio\nWith: Jennifer Lopez\n\nJoin Google Meet →\nView event details →",
        dateISO: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        unread: true,
        starred: true,
      },
      {
        id: "m12",
        mailbox: "inbox",
        from: "David Kim <d.kim@startup.io>",
        to: "you@tenant.com",
        subject: "Partnership opportunity",
        preview: "We're launching a new app for salon professionals and…",
        body:
          "Hi,\n\nWe're launching a new app for salon professionals and would love to have you as an early partner.\n\nWe're offering:\n• Free premium access for 6 months\n• Featured listing in our directory\n• Commission on referrals\n\nInterested in a quick call this week?\n\nBest,\nDavid",
        dateISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: false,
      },
      {
        id: "m13",
        mailbox: "inbox",
        from: "Reviews <noreply@google.com>",
        to: "you@tenant.com",
        subject: "New 5-star review!",
        preview: "Someone just left you a great review on Google",
        body:
          "New Review from Maria G.\n\n★★★★★ 5 stars\n\n\"Best haircut I've had in years! The atmosphere is great and the attention to detail is amazing. Will definitely be back!\"\n\nRespond to this review →",
        dateISO: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        unread: false,
        starred: true,
      },

      // SENT MESSAGES
      {
        id: "m3",
        mailbox: "sent",
        from: "you@tenant.com",
        to: "customer@email.com",
        subject: "Re: Your appointment options",
        preview: "Yep — we can do 2:10 or 4:40 today. Which works…",
        body:
          "Yep — we can do 2:10 or 4:40 today. Which works better?\n\n— Team",
        dateISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m14",
        mailbox: "sent",
        from: "you@tenant.com",
        to: "sarah.m@email.com",
        subject: "Re: Question about pricing packages",
        preview: "Hi Sarah! Great questions. Here's what's included…",
        body:
          "Hi Sarah!\n\nGreat questions. Here's what's included:\n\n1. Yes! Premium includes a 15-min styling consultation\n2. Free cancellation up to 24hrs before\n3. Absolutely - we offer recurring bookings with 10% off\n\nWant to schedule a consultation?\n\nBest,\nTeam",
        dateISO: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m15",
        mailbox: "sent",
        from: "you@tenant.com",
        to: "m.johnson@company.com",
        subject: "Re: Reschedule request for tomorrow",
        preview: "No problem! I have Wednesday at 3pm or Thursday at 10am…",
        body:
          "No problem Marcus!\n\nI have:\n• Wednesday at 3pm\n• Thursday at 10am\n• Thursday at 2:30pm\n\nWhich works best for you?\n\n— Team",
        dateISO: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m16",
        mailbox: "sent",
        from: "you@tenant.com",
        to: "alex.r@email.com",
        subject: "Re: First-time client - need advice",
        preview: "Hi Alex! Don't worry - I specialize in curly hair…",
        body:
          "Hi Alex!\n\nDon't worry - I specialize in curly hair and have tons of experience with thick, curly textures.\n\nFor your first visit, I recommend:\n• Dry cutting (shows the natural curl pattern)\n• Deep conditioning treatment\n• Curl-specific styling tips\n\nLet's start with a consultation! When works for you?\n\n— Team",
        dateISO: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m17",
        mailbox: "sent",
        from: "you@tenant.com",
        to: "supplier@beautyco.com",
        subject: "Product restock order",
        preview: "Hi! Need to reorder the following items…",
        body:
          "Hi,\n\nNeed to restock:\n\n• Premium shampoo (3 bottles)\n• Conditioner (3 bottles)\n• Styling cream (2 jars)\n• Hair oil (4 bottles)\n\nCan you confirm availability and ETA?\n\nThanks!",
        dateISO: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },

      // SPAM MESSAGES
      {
        id: "m4",
        mailbox: "spam",
        from: "Amazing SEO <boost@spam.co>",
        to: "you@tenant.com",
        subject: "🚀 Guaranteed #1 ranking",
        preview: "We can rank you #1 overnight with our secret method…",
        body: "Click here to unlock our secret SEO formula that guarantees #1 Google rankings in 24 hours! Limited time offer - only $99!\n\nBuy now →",
        dateISO: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m18",
        mailbox: "spam",
        from: "Get Rich Quick <money@scam.xyz>",
        to: "you@tenant.com",
        subject: "💰 Make $10,000 per week from home!",
        preview: "This one weird trick will change your life forever…",
        body: "Doctors HATE this one simple trick!\n\nMake $10,000 per week working from home with our proven system.\n\nClick here to start earning →",
        dateISO: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m19",
        mailbox: "spam",
        from: "Web Design Pro <sales@webspam.net>",
        to: "you@tenant.com",
        subject: "Your website NEEDS this upgrade NOW",
        preview: "We noticed your website is outdated and losing customers…",
        body: "URGENT: Your website is costing you thousands in lost revenue!\n\nOur AI-powered redesign will 10x your conversions.\n\nBook a call →",
        dateISO: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m20",
        mailbox: "spam",
        from: "Crypto Millionaire <invest@crypto-scam.com>",
        to: "you@tenant.com",
        subject: "🚀 Bitcoin secret revealed",
        preview: "I turned $100 into $1M with this simple method…",
        body: "EXCLUSIVE: Join my private Discord where I share my secret crypto trading strategy.\n\nOnly 10 spots left!\n\nJoin now →",
        dateISO: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },

      // DRAFT MESSAGES
      {
        id: "m5",
        mailbox: "drafts",
        from: "you@tenant.com",
        to: "lead@email.com",
        subject: "Quick question about your hours",
        preview: "Hey — just confirming your holiday hours so we can…",
        body:
          "Hey — just confirming your holiday hours so we can update the receptionist script.\n\nThanks!",
        dateISO: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m21",
        mailbox: "drafts",
        from: "you@tenant.com",
        to: "team@marketing.com",
        subject: "Social media content ideas",
        preview: "Here are some content ideas for next month…",
        body:
          "Content ideas for February:\n\n1. Behind-the-scenes styling videos\n2. Client transformations (with permission)\n3. Product recommendations\n4. Styling tips & tricks\n5. ",
        dateISO: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m22",
        mailbox: "drafts",
        from: "you@tenant.com",
        to: "landlord@property.com",
        subject: "Lease renewal discussion",
        preview: "Hi - wanted to discuss renewing the lease for another year…",
        body:
          "Hi,\n\nWanted to discuss renewing the lease for another year. Business has been great and I'd love to stay.\n\nCan we schedule a time to chat about terms?\n\n",
        dateISO: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },

      // TRASH MESSAGES  
      {
        id: "m23",
        mailbox: "trash",
        from: "Old Client <oldclient@email.com>",
        to: "you@tenant.com",
        subject: "Cancelling my subscription",
        preview: "Hi, I need to cancel my monthly membership…",
        body:
          "Hi,\n\nUnfortunately I need to cancel my monthly membership. Moving out of state next week.\n\nThanks for everything!",
        dateISO: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m24",
        mailbox: "trash",
        from: "Newsletter <weekly@newsletter.com>",
        to: "you@tenant.com",
        subject: "Weekly industry updates",
        preview: "Top 5 hair trends this week…",
        body: "This week's top trends:\n\n1. Butterfly cuts\n2. Money piece highlights\n3. Textured bobs\n4. Curtain bangs\n5. Natural colors",
        dateISO: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "m25",
        mailbox: "trash",
        from: "Expired Promo <promo@deals.com>",
        to: "you@tenant.com",
        subject: "Black Friday Sale - EXPIRED",
        preview: "This offer has ended",
        body: "This Black Friday promotion has ended.\n\nStay tuned for more deals!",
        dateISO: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    []
  );

  const counts = useMemo(() => {
    const c: Record<MailboxKey, number> = {
      inbox: 0,
      sent: 0,
      spam: 0,
      drafts: 0,
      trash: 0,
    };
    for (const m of messages) c[m.mailbox] += 1;
    return c;
  }, [messages]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return messages
      .filter((m) => m.mailbox === mailbox)
      .filter((m) => {
        if (!query) return true;
        const hay = `${m.from} ${m.to} ${m.subject} ${m.preview} ${m.body}`.toLowerCase();
        return hay.includes(query);
      })
      .sort(
        (a, b) => new Date(b.dateISO).getTime() - new Date(a.dateISO).getTime()
      );
  }, [messages, mailbox, q]);

  const selected = useMemo(
    () => list.find((m) => m.id === selectedId) || null,
    [list, selectedId]
  );

  useEffect(() => {
    if (!selectedId && list.length) setSelectedId(list[0].id);
  }, [list, selectedId]);

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

  const btn = (variant: "primary" | "ghost") =>
    cx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1 transition",
      variant === "primary"
        ? isDark
          ? "bg-white/10 text-white ring-white/15 hover:bg-white/15"
          : "bg-neutral-900 text-white ring-neutral-900/10 hover:bg-neutral-800"
        : isDark
        ? "bg-white/5 text-zinc-200 ring-white/10 hover:bg-white/10"
        : "bg-white text-neutral-900 ring-neutral-200 hover:bg-neutral-50"
    );

  const folders: Array<{ key: MailboxKey; label: string; icon: any }> = [
    { key: "inbox", label: "Inbox", icon: Inbox },
    { key: "sent", label: "Sent", icon: Send },
    { key: "drafts", label: "Drafts", icon: FileText },
    { key: "spam", label: "Spam", icon: ShieldAlert },
    { key: "trash", label: "Trash", icon: Trash2 },
  ];

  // Gmail/Outlook-ish widths
  const SIDEBAR_W = 260;
  const LIST_W = 360;

  // Calculate unread count
  const unreadCount = messages.filter(m => m.mailbox === "inbox" && m.unread).length;

  return (
    <div className={shell}>
      <div className="mx-auto w-full max-w-[1600px] px-6 py-8 flex flex-col flex-1">
        {/* Top header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1
              className={cx(
                "text-3xl font-bold tracking-tight",
                isDark ? "text-white" : "text-neutral-900"
              )}
            >
              Inbox
            </h1>
            <p
              className={cx(
                "mt-2 text-sm",
                isDark ? "text-zinc-400" : "text-neutral-600"
              )}
            >
              Unified inbox for all your communications.
            </p>
          </div>

          <div className="flex gap-2">
            <button className={btn("ghost")} onClick={() => setComposeOpen(true)}>
              <Plus size={16} /> Compose
            </button>
            <button
              className={btn("primary")}
              onClick={() => alert("Later: Connect Gmail / Outlook / Twilio")}
            >
              Connect Channels
            </button>
          </div>
        </div>

        {/* Stats Overview */}
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
                  <span className={cx(
                    "text-2xl font-bold",
                    isActive ? "" : isDark ? "text-white" : "text-neutral-900"
                  )}>
                    {count}
                  </span>
                </div>
                <div className={cx(
                  "text-sm font-semibold",
                  isActive ? "" : isDark ? "text-zinc-300" : "text-neutral-700"
                )}>
                  {f.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Main: true 3-pane layout - now fills remaining space */}
        <div className="mt-6 flex-1 flex flex-col min-h-0">
          <div className={cx(panel, "overflow-hidden flex-1 flex flex-col")}>
            <div className="flex min-h-0 flex-1">
              {/* Left folder rail - hidden on mobile, shown with stats above */}
              <aside
                className={cx(
                  "hidden lg:block shrink-0 border-r p-4",
                  isDark ? "border-white/10" : "border-neutral-200"
                )}
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
                            isDark
                              ? "bg-white/10 ring-white/10 text-zinc-200"
                              : "bg-neutral-100 ring-neutral-200 text-neutral-700"
                          )}
                        >
                          {counts[f.key]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className={cx(
                    "mt-4 rounded-xl border p-3",
                    isDark
                      ? "border-white/10 bg-white/5"
                      : "border-neutral-200 bg-neutral-50"
                  )}
                >
                  <div
                    className={cx(
                      "text-xs font-semibold",
                      isDark ? "text-zinc-200" : "text-neutral-800"
                    )}
                  >
                    Channels (soon)
                  </div>
                  <div
                    className={cx(
                      "mt-2 text-xs",
                      isDark ? "text-zinc-400" : "text-neutral-600"
                    )}
                  >
                    Email (Gmail/Outlook) + SMS/WhatsApp (Twilio) will all land here.
                  </div>
                </div>
              </aside>

              {/* Right: list + reader */}
              <div className="flex min-w-0 flex-1">
                {/* Middle list column */}
                <div
                  className={cx(
                    "shrink-0 border-r flex flex-col",
                    isDark ? "border-white/10" : "border-neutral-200"
                  )}
                  style={{ width: LIST_W }}
                >
                  {/* Search + mailbox header */}
                  <div
                    className={cx(
                      "p-4 border-b",
                      isDark ? "border-white/10" : "border-neutral-200"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div
                          className={cx(
                            "text-sm font-semibold truncate",
                            isDark ? "text-white" : "text-neutral-900"
                          )}
                        >
                          {folders.find((f) => f.key === mailbox)?.label}
                        </div>
                        <div
                          className={cx(
                            "text-xs",
                            isDark ? "text-zinc-400" : "text-neutral-600"
                          )}
                        >
                          {list.length} message{list.length === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="relative">
                        <Search
                          size={16}
                          className={cx(
                            "absolute left-3 top-1/2 -translate-y-1/2",
                            isDark ? "text-zinc-400" : "text-neutral-500"
                          )}
                        />
                        <input
                          className={cx(input, "pl-9")}
                          placeholder="Search…"
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Message list - fills remaining height */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {list.length === 0 ? (
                      <div
                        className={cx(
                          "p-6 text-sm",
                          isDark ? "text-zinc-400" : "text-neutral-600"
                        )}
                      >
                        No messages.
                      </div>
                    ) : (
                      list.map((m) => {
                        const active = selectedId === m.id;
                        return (
                          <button
                            key={m.id}
                            onClick={() => setSelectedId(m.id)}
                            className={cx(
                              "w-full text-left px-4 py-3 border-b transition",
                              isDark ? "border-white/10" : "border-neutral-200",
                              active
                                ? isDark
                                  ? "bg-white/10"
                                  : "bg-neutral-100"
                                : isDark
                                ? "hover:bg-white/[0.05]"
                                : "hover:bg-neutral-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  {m.unread ? (
                                    <span
                                      className={cx(
                                        "h-2 w-2 rounded-full",
                                        isDark ? "bg-white" : "bg-neutral-900"
                                      )}
                                    />
                                  ) : (
                                    <span className="h-2 w-2" />
                                  )}
                                  <div
                                    className={cx(
                                      "truncate text-sm font-medium",
                                      isDark ? "text-white" : "text-neutral-900"
                                    )}
                                  >
                                    {m.subject}
                                  </div>
                                </div>

                                <div
                                  className={cx(
                                    "mt-1 truncate text-xs",
                                    isDark ? "text-zinc-400" : "text-neutral-600"
                                  )}
                                >
                                  {m.from}
                                </div>

                                <div
                                  className={cx(
                                    "mt-1 truncate text-xs",
                                    isDark ? "text-zinc-500" : "text-neutral-500"
                                  )}
                                >
                                  {m.preview}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                <div
                                  className={cx(
                                    "text-xs",
                                    isDark ? "text-zinc-500" : "text-neutral-500"
                                  )}
                                >
                                  {formatDT(m.dateISO)}
                                </div>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert("UI only: star toggle later");
                                  }}
                                  className={cx(
                                    "grid h-8 w-8 place-items-center rounded-lg ring-1 transition",
                                    isDark
                                      ? "bg-white/5 ring-white/10 hover:bg-white/10"
                                      : "bg-white ring-neutral-200 hover:bg-neutral-50"
                                  )}
                                >
                                  <Star
                                    size={14}
                                    className={
                                      m.starred
                                        ? isDark
                                          ? "text-white"
                                          : "text-neutral-900"
                                        : isDark
                                        ? "text-zinc-400"
                                        : "text-neutral-500"
                                    }
                                  />
                                </button>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Reading pane - fills remaining width and height */}
                <div className="min-w-0 flex-1 flex flex-col">
                  <div
                    className={cx(
                      "px-4 py-3 border-b flex items-center justify-between",
                      isDark ? "border-white/10" : "border-neutral-200"
                    )}
                  >
                    <div className="min-w-0">
                      <div
                        className={cx(
                          "truncate text-sm font-semibold",
                          isDark ? "text-white" : "text-neutral-900"
                        )}
                      >
                        {selected?.subject || "Select a message"}
                      </div>
                      {selected ? (
                        <div
                          className={cx(
                            "mt-1 text-xs",
                            isDark ? "text-zinc-400" : "text-neutral-600"
                          )}
                        >
                          From: {selected.from} • To: {selected.to}
                        </div>
                      ) : (
                        <div
                          className={cx(
                            "mt-1 text-xs",
                            isDark ? "text-zinc-500" : "text-neutral-500"
                          )}
                        >
                          Pick a thread to preview.
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className={btn("ghost")}
                        onClick={() => alert("UI only: archive later")}
                      >
                        <Archive size={16} />
                        <span className="hidden sm:inline">Archive</span>
                      </button>
                      <button
                        className={btn("ghost")}
                        onClick={() => setComposeOpen(true)}
                      >
                        <Reply size={16} />
                        <span className="hidden sm:inline">Reply</span>
                      </button>
                      <button
                        className={cx(btn("ghost"), "px-3")}
                        onClick={() => alert("More actions later")}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto min-h-0">
                    {selected ? (
                      <div
                        className={cx(
                          "rounded-2xl border p-4",
                          isDark
                            ? "border-white/10 bg-white/5"
                            : "border-neutral-200 bg-white"
                        )}
                      >
                        <div
                          className={cx(
                            "text-xs",
                            isDark ? "text-zinc-400" : "text-neutral-600"
                          )}
                        >
                          {formatDT(selected.dateISO)}
                        </div>
                        <pre
                          className={cx(
                            "mt-3 whitespace-pre-wrap text-sm leading-relaxed",
                            isDark ? "text-zinc-100" : "text-neutral-800"
                          )}
                        >
                          {selected.body}
                        </pre>
                      </div>
                    ) : (
                      <div
                        className={cx(
                          "p-10 text-center text-sm",
                          isDark ? "text-zinc-400" : "text-neutral-600"
                        )}
                      >
                        No message selected.
                      </div>
                    )}

                    <div
                      className={cx(
                        "mt-4 rounded-2xl border p-4",
                        isDark
                          ? "border-white/10 bg-white/[0.03]"
                          : "border-neutral-200 bg-neutral-50"
                      )}
                    >
                      <div
                        className={cx(
                          "text-sm font-semibold",
                          isDark ? "text-white" : "text-neutral-900"
                        )}
                      >
                        AI Assist (later)
                      </div>
                      <div
                        className={cx(
                          "mt-1 text-xs",
                          isDark ? "text-zinc-400" : "text-neutral-600"
                        )}
                      >
                        Summarize threads, draft replies, and suggest follow-ups using
                        your Knowledge Base + MyReceptionist settings.
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          className={btn("ghost")}
                          onClick={() => alert("Later: AI summary")}
                        >
                          Summarize
                        </button>
                        <button
                          className={btn("ghost")}
                          onClick={() => alert("Later: Draft reply")}
                        >
                          Draft reply
                        </button>
                        <button
                          className={btn("primary")}
                          onClick={() => setComposeOpen(true)}
                        >
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
                  <div
                    className={cx(
                      "flex items-center justify-between px-5 py-4 border-b",
                      isDark ? "border-white/10" : "border-neutral-200"
                    )}
                  >
                    <div>
                      <div className={cx("text-lg font-semibold", isDark ? "text-white" : "text-neutral-900")}>
                        Compose
                      </div>
                      <div className={cx("text-xs", isDark ? "text-zinc-400" : "text-neutral-600")}>
                        UI only for now. Wiring later.
                      </div>
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
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>
                            To
                          </label>
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
                        <input
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className={input}
                          placeholder="customer@email.com"
                        />
                      </div>

                      {showCC && (
                        <div>
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>
                            CC
                          </label>
                          <input
                            value={cc}
                            onChange={(e) => setCC(e.target.value)}
                            className={input}
                            placeholder="cc@email.com"
                          />
                        </div>
                      )}

                      {showBCC && (
                        <div>
                          <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>
                            BCC
                          </label>
                          <input
                            value={bcc}
                            onChange={(e) => setBCC(e.target.value)}
                            className={input}
                            placeholder="bcc@email.com"
                          />
                        </div>
                      )}

                      <div>
                        <label className={cx("text-xs font-medium", isDark ? "text-zinc-300" : "text-neutral-700")}>
                          Subject
                        </label>
                        <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className={input}
                          placeholder="Subject line…"
                        />
                      </div>
                    </div>

                    {/* Toolbar */}
                    <div
                      className={cx(
                        "flex flex-wrap items-center gap-2 rounded-xl border p-2",
                        isDark ? "border-white/10 bg-white/5" : "border-neutral-200 bg-neutral-50"
                      )}
                    >
                      <button className={btn("ghost")} onClick={() => alert("UI only: bold")}>
                        <Bold size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => alert("UI only: italic")}>
                        <Italic size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => alert("UI only: underline")}>
                        <Underline size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => alert("UI only: link")}>
                        <Link2 size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => alert("UI only: list")}>
                        <List size={16} />
                      </button>
                      <button className={btn("ghost")} onClick={() => alert("UI only: image")}>
                        <ImageIcon size={16} />
                      </button>

                      <div className="flex-1" />

                      <button className={btn("ghost")} onClick={() => alert("UI only: attach")}>
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
                        Next: wire Send → Gmail/Outlook provider, store drafts per tenant.
                      </div>

                      <div className="flex gap-2">
                        <button className={btn("ghost")} onClick={() => alert("UI only: save draft")}>
                          Save draft
                        </button>
                        <button className={btn("primary")} onClick={() => alert("UI only: send later")}>
                          Send
                        </button>
                      </div>
                    </div>
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