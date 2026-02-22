"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Phone,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  Cloud,
  Music,
} from "lucide-react";

type Metrics = {
  businessName: string;
  totals: { appointments: number; calls: number; customers: number };
  today: { callsToday: number; apptsToday: number };
};

type Props = {
  metrics: Metrics;
};

interface SpotifyTrack {
  name: string;
  artist: string;
  albumArt: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

const clampPct = (n: number) => Math.min(100, Math.max(0, n));

export default function DashboardGrid({ metrics }: Props) {
  const [weather, setWeather] = useState<{
    location: string;
    summary: string;
    temp?: string;
  } | null>(null);
  const [weatherErr, setWeatherErr] = useState("");
  const [spotifyTrack, setSpotifyTrack] = useState<SpotifyTrack | null>(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setWeatherErr("Location unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`/api/weather?lat=${latitude}&lon=${longitude}`);
          const d = await r.json();
          if (!d?.ok) throw new Error(d?.error || "Weather failed");
          setWeather({ location: d.location, summary: d.summary, temp: d.temp });
        } catch {
          setWeatherErr("Weather unavailable");
        }
      },
      () => setWeatherErr("Location denied"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    const pull = () =>
      fetch("/api/spotify/now-playing")
        .then((r) => r.json())
        .then((d) => {
          if (d?.ok && d?.track) setSpotifyTrack(d.track);
          else setSpotifyTrack(null);
        })
        .catch(() => {});
    pull();
    const interval = setInterval(pull, 5000);
    return () => clearInterval(interval);
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // ✅ Futuristic theme tokens (no orange)
  const theme = {
    bgBase: "#070A12", // near-black navy
    grid: "rgba(255,255,255,0.06)",
    panel: "rgba(255,255,255,0.06)",
    panel2: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.14)",
    borderStrong: "rgba(255,255,255,0.20)",
    text: "rgba(255,255,255,0.92)",
    mut: "rgba(255,255,255,0.65)",
    mut2: "rgba(255,255,255,0.45)",
    glowCyan: "rgba(34,211,238,0.18)",
    glowViolet: "rgba(139,92,246,0.18)",
    glowIndigo: "rgba(99,102,241,0.18)",
  };

  return (
    <div
      className="light-mode-only"
      style={{
        minHeight: "100vh",
        padding: "2rem",
        color: theme.text,
        background: theme.bgBase,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ✅ Aurora gradient blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.28), rgba(34,211,238,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(139,92,246,0.26), rgba(139,92,246,0) 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.20), rgba(99,102,241,0) 62%)",
        }}
      />

      {/* ✅ Grid overlay */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(${theme.grid} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.grid} 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at 30% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0) 100%)",
          opacity: 0.9,
        }}
      />

      <div className="max-w-[1800px] mx-auto space-y-6 relative z-10">
        {/* Outer glass container */}
        <div
          className="rounded-3xl border shadow-2xl backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            borderColor: theme.border,
            boxShadow:
              "0 30px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
            padding: "1.5rem",
          }}
        >
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Business */}
              <GlassCard
                border={theme.borderStrong}
                bg={theme.panel2}
                glow={theme.glowIndigo}
              >
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mut }}>
                  {greeting} • {currentTime}
                </div>
                <h1 className="mt-2 text-2xl font-black" style={{ color: theme.text }}>
                  {metrics.businessName}
                </h1>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ background: "rgba(34,211,238,0.95)", boxShadow: "0 0 18px rgba(34,211,238,0.55)" }}
                  />
                  <span className="text-sm font-semibold" style={{ color: theme.mut }}>
                    Systems online
                  </span>
                </div>
              </GlassCard>

              {/* Weather */}
              <GlassCard
                border={theme.borderStrong}
                bg={theme.panel2}
                glow={theme.glowCyan}
              >
                {weather ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Cloud size={18} style={{ color: "rgba(34,211,238,0.95)" }} />
                      <span className="text-sm font-semibold" style={{ color: theme.mut }}>
                        {weather.location}
                      </span>
                    </div>
                    {weather.temp && (
                      <div className="mt-3 text-5xl font-black tracking-tight" style={{ color: theme.text }}>
                        {weather.temp}
                      </div>
                    )}
                    <div className="mt-1 text-sm" style={{ color: theme.mut2 }}>
                      {weather.summary}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Cloud
                        size={18}
                        className={!weatherErr ? "animate-pulse" : ""}
                        style={{ color: "rgba(34,211,238,0.70)" }}
                      />
                      <span className="text-sm" style={{ color: theme.mut }}>
                        {weatherErr || "Loading weather..."}
                      </span>
                    </div>
                  </>
                )}
              </GlassCard>

              {/* Spotify */}
              {spotifyTrack ? (
                <GlassCard
                  border={theme.borderStrong}
                  bg={theme.panel2}
                  glow={theme.glowViolet}
                >
                  <div className="flex items-start gap-3">
                    {spotifyTrack.albumArt && (
                      <img
                        src={spotifyTrack.albumArt}
                        alt="Album"
                        className="w-14 h-14 rounded-xl border"
                        style={{ borderColor: theme.border }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Music size={16} style={{ color: "rgba(139,92,246,0.95)" }} />
                        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mut }}>
                          Now playing
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-semibold truncate" style={{ color: theme.text }}>
                        {spotifyTrack.name}
                      </div>
                      <div className="text-xs truncate" style={{ color: theme.mut2 }}>
                        {spotifyTrack.artist}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full overflow-hidden border" style={{ borderColor: theme.border }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${clampPct((spotifyTrack.progress / spotifyTrack.duration) * 100)}%`,
                        background:
                          "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(139,92,246,0.95))",
                      }}
                    />
                  </div>
                </GlassCard>
              ) : (
                <GlassCard border={theme.borderStrong} bg={theme.panel2} glow={theme.glowViolet}>
                  <div className="flex items-center gap-2">
                    <Music size={18} style={{ color: theme.mut2 }} />
                    <span className="text-sm font-semibold" style={{ color: theme.mut }}>
                      Connect Spotify
                    </span>
                  </div>
                </GlassCard>
              )}
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HeroCard
                title="Calls Handled"
                badge="TODAY"
                value={metrics.today.callsToday}
                icon={<Phone className="w-6 h-6" />}
                gradient="linear-gradient(135deg, rgba(34,211,238,0.28), rgba(99,102,241,0.22), rgba(139,92,246,0.18))"
                border={theme.borderStrong}
                sub={<><TrendingUp size={18} /> <span className="font-semibold">Live monitoring active</span></>}
                theme={theme}
              />

              <HeroCard
                title="Appointments Booked"
                badge="TODAY"
                value={metrics.today.apptsToday}
                icon={<Calendar className="w-6 h-6" />}
                gradient="linear-gradient(135deg, rgba(99,102,241,0.26), rgba(34,211,238,0.20), rgba(139,92,246,0.18))"
                border={theme.borderStrong}
                sub={<><CheckCircle size={18} /> <span className="font-semibold">All confirmed & ready</span></>}
                theme={theme}
              />
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <MiniStat
                theme={theme}
                icon={<Phone size={18} />}
                value={metrics.totals.calls.toLocaleString()}
                label="Total Calls"
                glow="rgba(34,211,238,0.18)"
              />
              <MiniStat
                theme={theme}
                icon={<Calendar size={18} />}
                value={metrics.totals.appointments.toLocaleString()}
                label="Appointments"
                glow="rgba(99,102,241,0.18)"
              />
              <MiniStat
                theme={theme}
                icon={<Users size={18} />}
                value={metrics.totals.customers.toLocaleString()}
                label="Customers"
                glow="rgba(139,92,246,0.18)"
              />
              <MiniStat
                theme={theme}
                icon={<CheckCircle size={18} />}
                value="94.2%"
                label="Success Rate"
                glow="rgba(34,211,238,0.14)"
              />
              <MiniStat
                theme={theme}
                icon={<Clock size={18} />}
                value="42s"
                label="Avg Response"
                glow="rgba(99,102,241,0.14)"
              />
              <MiniStat
                theme={theme}
                icon={<Activity size={18} className="animate-pulse" />}
                value="2"
                label="Active Now"
                glow="rgba(239,68,68,0.10)"
              />
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <HealthCard title="AI Receptionist" theme={theme} glow="rgba(34,211,238,0.16)" />
              <HealthCard title="Phone System" theme={theme} glow="rgba(99,102,241,0.16)" />
              <HealthCard title="Booking Engine" theme={theme} glow="rgba(139,92,246,0.16)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlassCard({
  children,
  bg,
  border,
  glow,
}: {
  children: React.ReactNode;
  bg: string;
  border: string;
  glow: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border backdrop-blur-xl p-6"
      style={{
        background: bg,
        borderColor: border,
        boxShadow:
          "0 16px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: glow }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function HeroCard({
  title,
  badge,
  value,
  icon,
  gradient,
  border,
  sub,
  theme,
}: any) {
  return (
    <div
      className="relative overflow-hidden rounded-3xl border backdrop-blur-xl p-10"
      style={{
        background: gradient,
        borderColor: border,
        boxShadow:
          "0 22px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.14), rgba(255,255,255,0) 45%)",
          opacity: 0.6,
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div
            className="h-12 w-12 rounded-2xl border flex items-center justify-center"
            style={{
              background: "rgba(0,0,0,0.18)",
              borderColor: theme.border,
              color: theme.text,
            }}
          >
            {icon}
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border"
            style={{
              background: "rgba(0,0,0,0.18)",
              borderColor: theme.border,
              color: theme.mut,
            }}
          >
            {badge}
          </div>
        </div>

        <div className="text-8xl font-black leading-none tracking-tight" style={{ color: theme.text }}>
          {value}
        </div>
        <div className="mt-2 text-xl font-semibold" style={{ color: theme.mut }}>
          {title}
        </div>

        <div className="mt-5 flex items-center gap-2" style={{ color: theme.mut }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ theme, icon, value, label, glow }: any) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border backdrop-blur-xl p-5"
      style={{
        background: theme.panel,
        borderColor: theme.border,
        boxShadow: "0 14px 50px rgba(0,0,0,0.42)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: glow }}
      />
      <div className="relative z-10">
        <div className="mb-3" style={{ color: theme.mut }}>
          {icon}
        </div>
        <div className="text-3xl font-black tracking-tight" style={{ color: theme.text }}>
          {value}
        </div>
        <div className="mt-1 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mut2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, theme, glow }: any) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border backdrop-blur-xl p-6"
      style={{
        background: theme.panel,
        borderColor: theme.border,
        boxShadow: "0 14px 50px rgba(0,0,0,0.42)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -right-20 h-52 w-52 rounded-full blur-3xl"
        style={{ background: glow }}
      />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-black" style={{ color: theme.text }}>
            {title}
          </h3>
          <div className="mt-2 text-sm font-semibold" style={{ color: theme.mut2 }}>
            Uptime: 99.9%
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: "rgba(34,211,238,0.95)", boxShadow: "0 0 18px rgba(34,211,238,0.45)" }}
          />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.mut }}>
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
