 "use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import SmokeBackground from "./SmokeBackground";

/**
 * 4-phase typewriter:
 * 1) 24/7 AI Receptionist + Smart Auto-Booking
 * 2) The Ultimate Customer Management Platform
 * 3) AI-Powered Lead Management & Generation
 * 4) Built to Capture More Leads, Close Faster, and Increase Revenue
 *
 * ✅ Subheading fades in ONLY after final line finishes typing
 * ✅ CTA buttons fade in after subheading
 * ✅ Video placeholder animates UP + fades in with the arrow
 * ✅ Arrow is SHORT (clamped) and BENDS from the word "revenue" toward the TOP of the video (6 o'clock)
 * ✅ Cursor stops blinking after typing completes
 * ✅ No layout shift — reserved headline height
 * ✅ Video stays UNDER the hero (NOT side-by-side)
 */

type Phase = 0 | 1 | 2 | 3;

function usePhasedTypewriter(
  phases: string[],
  opts?: {
    typeMs?: number;
    holdMs?: number;
    betweenMs?: number;
  }
) {
  const typeMs = opts?.typeMs ?? 46;
  const holdMs = opts?.holdMs ?? 1350;
  const betweenMs = opts?.betweenMs ?? 560;

  const [phase, setPhase] = useState<Phase>(0);
  const [txt, setTxt] = useState("");

  const full = phases[phase] ?? "";
  const isTyping = txt.length < full.length;

  useEffect(() => {
    if (!full) return;

    // typing forward
    if (txt.length < full.length) {
      const t = setTimeout(() => setTxt(full.slice(0, txt.length + 1)), typeMs);
      return () => clearTimeout(t);
    }

    // move to next phase only if not last
    if (phase < phases.length - 1) {
      const t = setTimeout(() => {
        setTimeout(() => {
          setPhase((p) => (p + 1) as Phase);
          setTxt("");
        }, betweenMs);
      }, holdMs);

      return () => clearTimeout(t);
    }
  }, [txt, phase, full, phases.length, typeMs, holdMs, betweenMs]);

  return { phase, txt, isTyping };
}

export default function HeroSectionTwoColumns() {
  // IMPORTANT: last line includes the word "revenue" (we anchor arrow to it)
  const lines = useMemo(
    () => [
    
      
      "Built to Capture More Leads, Close Faster, and Increase Revenue",
    ],
    []
  );

  const { phase, txt, isTyping } = usePhasedTypewriter(lines, {
    typeMs: 38, // slightly slower
    holdMs: 1000,
    betweenMs: 400,
  });

  const isFinal = phase === lines.length - 1;
  const typingDone = isFinal && !isTyping;

  const [showSub, setShowSub] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Arrow state (path)
  const [arrow, setArrow] = useState<{ d: string } | null>(null);

  // Refs for geometry
  const sectionRef = useRef<HTMLElement | null>(null);
  const revenueRef = useRef<HTMLSpanElement | null>(null);
  const videoRef = useRef<HTMLDivElement | null>(null);

  // Reveal sequence after typing stops
  useEffect(() => {
    if (typingDone) {
      const t1 = setTimeout(() => setShowSub(true), 180);
      const t2 = setTimeout(() => setShowCta(true), 520);
      const t3 = setTimeout(() => setShowVideo(true), 700); // ✅ video + arrow start together

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    setShowSub(false);
    setShowCta(false);
    setShowVideo(false);
    setArrow(null);
  }, [typingDone]);

  // Build a SHORT, BENT arrow path from the word "revenue" to top of video
  useEffect(() => {
    if (!showVideo) return;

    const calc = () => {
      const section = sectionRef.current;
      const revenueEl = revenueRef.current;
      const videoEl = videoRef.current;
      if (!section || !revenueEl || !videoEl) return;

      const sRect = section.getBoundingClientRect();
      const r = revenueEl.getBoundingClientRect();
      const v = videoEl.getBoundingClientRect();

      // Start at revenue (center-bottom of the word)
      const x1 = r.left + r.width * 0.65 - sRect.left; // moved right from 0.55
      const y1 = r.top + r.height * 0.98 - sRect.top;

      // End at top area of video (center-ish)
      const targetX = v.left + v.width * 0.68 - sRect.left; // moved right from 0.58
      const targetY = v.top + v.height * 0.08 - sRect.top; // near top of video

      // ✅ Clamp arrow length so it's never absurdly long
      const maxDrop = 220; // adjust 180–260 for taste
      const y2 = Math.min(targetY, y1 + maxDrop);
      const x2 = targetX;

      // ✅ Gentle curve
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;

      const bend = 80; // horizontal curve strength
      const cx = midX + bend;
      const cy = midY - 18;

      const d = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      setArrow({ d });
    };

    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);

    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
    };
  }, [showVideo]);

  // Styling helpers
  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    width: "fit-content",
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    backdropFilter: "blur(10px)",
  };

  return (
    
    <section
      ref={sectionRef}
      style={{
        width: "100%",
        minHeight: "calc(100vh - 140px)",
        display: "flex",
        alignItems: "center",
        padding: "56px 0",
        position: "relative",
      }}
    >
      {/* ✅ Column layout (video UNDER the hero) */}
      
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 48,
        }}
      >
        {/* TOP: HERO TEXT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Badge */}
          <div style={badgeStyle}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "rgba(52,211,153,0.9)",
                boxShadow: "0 0 18px rgba(52,211,153,0.45)",
              }}
            />
            Live AI demo • Calls → Booking → CRM
          </div>

          {/* ✅ No layout shift area (reserves space for longest line) */}
          <div style={{ minHeight: "clamp(210px, 18vw, 330px)" }}>
            <h1
              style={{
                margin: 0,
                color: "#fff",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
                fontSize: "clamp(50px, 4.5vw, 98px)",
                animation: "softBounce 3s ease-in-out infinite",
              }}
            >
              {/* ✅ If we're on final line, split around the word "Revenue" so we can anchor the arrow */}
              {isFinal ? (
                <>
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(249,115,22,0.9), rgba(239,68,68,0.85))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {/* We rebuild the final line to wrap "Revenue" with a ref */}
                    {(() => {
                      const fullFinal = lines[lines.length - 1];
                      // Find "Revenue" (case-insensitive, first occurrence)
                      const idx = fullFinal.toLowerCase().indexOf("revenue");
                      if (idx === -1) return txt;

                      const before = fullFinal.slice(0, idx);
                      const word = fullFinal.slice(idx, idx + "Revenue".length);
                      const after = fullFinal.slice(idx + "Revenue".length);

                      // But we only display what has been typed so far (txt).
                      // So we slice the "before/word/after" based on txt length.
                      const typedLen = txt.length;

                      const b = before.slice(0, Math.min(before.length, typedLen));
                      const remainingAfterBefore = typedLen - before.length;

                      const w =
                        remainingAfterBefore > 0
                          ? word.slice(0, Math.min(word.length, remainingAfterBefore))
                          : "";

                      const remainingAfterWord = remainingAfterBefore - word.length;

                      const a =
                        remainingAfterWord > 0
                          ? after.slice(0, Math.min(after.length, remainingAfterWord))
                          : "";

                      return (
                        <>
                          {b}
                          <span
                            ref={revenueRef}
                            style={{
                              color: "rgba(165,243,252,1)",
                              textShadow: showVideo
                                ? "0 0 28px rgba(251,146,60,0.30)"
                                : "none",
                            }}
                          >
                            {w}
                          </span>
                          {a}
                        </>
                      );
                    })()}
                  </span>

                  {/* Cursor */}
                  <span
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: "1.05em",
                      marginLeft: 10,
                      transform: "translateY(0.08em)",
                      background: "rgba(255,255,255,0.75)",
                      animation: typingDone ? "none" : "pulse 1s infinite",
                      opacity: typingDone ? 0.35 : 1,
                    }}
                  />
                </>
              ) : (
                <>
                  <span
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(252, 200, 165, 1), rgba(199,210,254,1), rgba(221,214,254,1))",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    {txt}
                  </span>

                  <span
                    style={{
                      display: "inline-block",
                      width: 4,
                      height: "1.05em",
                      marginLeft: 10,
                      transform: "translateY(0.08em)",
                      background: "rgba(255,255,255,0.75)",
                      animation: typingDone ? "none" : "pulse 1s infinite",
                      opacity: typingDone ? 0.35 : 1,
                    }}
                  />
                </>
              )}
            </h1>

            {/* ✅ Subheading fades in after typing stops */}
            <div
              style={{
                marginTop: 14,
                maxWidth: 820,
                color: "rgba(244,244,245,0.78)",
                fontSize: "clamp(16px, 1.2vw, 20px)",
                lineHeight: 1.55,
                opacity: showSub ? 1 : 0,
                transform: showSub ? "translateY(0px)" : "translateY(8px)",
                transition: "opacity 550ms ease, transform 550ms ease",
              }}
            >
              Your AI answers every call, books appointments instantly, and keeps customers + leads organized — so you can
              focus on service while revenue stacks up.
            </div>
          </div>

          {/* ✅ CTAs fade in last */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              paddingTop: 14,
              opacity: showCta ? 1 : 0,
              transform: showCta ? "translateY(0px)" : "translateY(10px)",
              transition: "opacity 600ms ease, transform 600ms ease",
            }}
          >
            {/* Primary */}
            <Link
              href="/demo"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 34px",
                borderRadius: 20,
                fontWeight: 900,
                fontSize: 16,
                color: "#fff",
                background:
                  "linear-gradient(135deg, rgba(249,115,22,1) 0%, rgba(239,68,68,1) 100%)",
                boxShadow:
                  "0 20px 80px -30px rgba(249,115,22,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow =
                  "0 30px 100px -30px rgba(249,115,22,0.8), inset 0 0 0 1px rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 20px 80px -30px rgba(249,115,22,0.6), inset 0 0 0 1px rgba(255,255,255,0.1)";
              }}
            >
              Request a Demo
            </Link>

            {/* Secondary (border gradient) */}
            <Link
              href="/pricing"
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "18px 34px",
                borderRadius: 20,
                fontWeight: 900,
                fontSize: 16,
                color: "#fff",
                background: "rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                border: "2px solid rgba(249,115,22,0.3)",
                transition: "transform 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.borderColor = "rgba(249,115,22,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(249,115,22,0.3)";
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* ✅ Arrow overlay (short + bent) */}
        {showVideo && arrow && (
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ overflow: "visible" }}
          >
            <defs>
              <marker
                id="arrowHead"
                markerWidth="14"
                markerHeight="14"
                refX="10"
                refY="7"
                orient="auto"
              >
                <path d="M0,0 L14,7 L0,14 Z" fill="#fb923c" />
              </marker>
            </defs>

            <path
              d={arrow.d}
              fill="none"
              stroke="#fb923c"
              strokeWidth="4"
              strokeLinecap="round"
              markerEnd="url(#arrowHead)"
              style={{
                opacity: showVideo ? 1 : 0,
                filter: "drop-shadow(0 10px 25px rgba(251,146,60,0.25))",
                strokeDasharray: 900,
                strokeDashoffset: showVideo ? 0 : 900,
                transition: "stroke-dashoffset 900ms ease, opacity 500ms ease",
              }}
            />
          </svg>
        )}

        {/* ✅ VIDEO (under hero) animates up + fades in */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            ref={videoRef}
            style={{
              width: "100%",
              maxWidth: 1200,
              borderRadius: 26,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              overflow: "hidden",
              minHeight: 520,
              height: "clamp(420px, 38vw, 640px)",
              position: "relative",
              boxShadow: "0 30px 120px -70px rgba(0,0,0,0.9)",

              opacity: showVideo ? 1 : 0,
              transform: showVideo ? "translateY(0px)" : "translateY(16px)",
              transition: "opacity 700ms ease, transform 700ms ease",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 30% 20%, rgba(34,211,238,0.22), rgba(0,0,0,0) 55%), radial-gradient(circle at 80% 60%, rgba(139,92,246,0.20), rgba(0,0,0,0) 58%)",
                opacity: 0.9,
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                textAlign: "center",
                padding: 32,
              }}
            >
              <div>
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 20,
                    background: "#fff",
                    color: "#000",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 34,
                    margin: "0 auto",
                    boxShadow: "0 40px 110px -50px rgba(0,0,0,0.95)",
                  }}
                >
                  ▶
                </div>

                {/* ✅ Real hero video */}
<video
  src="/videos/0202.mp4"
  poster="/vid.png"
  controls={true}
  
  playsInline
  preload="metadata"
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
  }}
/>

{/* Optional: subtle overlay for readability */}
<div
  style={{
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
    pointerEvents: "none",
  }}
/>


               
              </div>
            </div>
          </div>
        </div>
      </div>
       
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:1} }
        @keyframes softBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </section>
  );
}