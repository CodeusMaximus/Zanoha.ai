"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HeroSection from "./components/Herosection";
import About from "./components/About";
import Features from "./components/features";
import FAQs from "./components/FAQs";
import PricingSection from "./components/PricingSection";
import Testimonials from "./components/Testimonials";
import AIComparison from "./components/Aicomparison";
import ScrollNavigation from "./components/ScrollNavigation";

export default function HomePage() {
  const [currentSection, setCurrentSection] = useState(0);

  // Store section elements by index
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // ✅ Callback refs must return void (not the element). This helper guarantees that.
  const setSectionRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
  };

  const phrases = useMemo(
    () => [
      "finishing a fade",
      "with a client",
      "washing up",
      "driving to a job",
      "on another call",
      "in the back office",
      "at lunch",
      "closing up",
      "doing inventory",
      "running errands",
    ],
    []
  );

  const typed = useTypewriterRotate(phrases, {
    typeMs: 38,
    deleteMs: 24,
    holdMs: 1100,
    betweenMs: 250,
  });

  // Total sections (excluding navbar and footer)
  const TOTAL_SECTIONS = 7; // Hero, AIComparison, Features, About, Testimonials, FAQs, Pricing

  // Handle navigation
  const handleNavigate = (direction: "up" | "down") => {
    const newSection =
      direction === "up"
        ? Math.max(0, currentSection - 1)
        : Math.min(TOTAL_SECTIONS - 1, currentSection + 1);

    setCurrentSection(newSection);

    // Scroll to section
    const targetSection = sectionRefs.current[newSection];
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Track scroll position to update current section
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      for (let i = 0; i < sectionRefs.current.length; i++) {
        const section = sectionRefs.current[i];
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setCurrentSection(i);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="min-h-screen text-zinc-100 flex flex-col"
      style={{ background: "#050504ff" }}
    >
      <FuturisticBg />
      <Navbar />

      <main className="flex-1 relative z-10">
        <div className="mx-auto w-full max-w-[1400px] px-6 pt-8 md:pt-12">
          <section ref={setSectionRef(0)} id="hero">
            <HeroSection />
          </section>

          <section ref={setSectionRef(1)} id="comparison">
            <AIComparison />
          </section>

          <section ref={setSectionRef(2)} id="features">
            <Features />
          </section>

          <section ref={setSectionRef(3)} id="about">
            <About />
          </section>

          <section ref={setSectionRef(4)} id="testimonials">
            <Testimonials />
          </section>

          <section ref={setSectionRef(5)} id="faqs">
            <FAQs />
          </section>

          <section ref={setSectionRef(6)} id="pricing">
            <PricingSection />
          </section>
        </div>
      </main>
         <section ref={setSectionRef(7)} id="footer">
      <Footer />
         </section>
      {/* Scroll Navigation */}
      <ScrollNavigation
        totalSections={TOTAL_SECTIONS}
        currentSection={currentSection}
        onNavigate={handleNavigate}
        isDarkBackground={true}
      />
    </div>
  );
}

/** ✅ Background component: grid + aurora blobs */
function FuturisticBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* aurora blobs */}
      <div
        className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(34,211,238,0.28), rgba(34,211,238,0) 60%)",
        }}
      />
      <div
        className="absolute -bottom-48 -right-48 h-[620px] w-[620px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(139,92,246,0.26), rgba(139,92,246,0) 60%)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.20), rgba(99,102,241,0) 62%)",
        }}
      />

      {/* grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(circle at 30% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0.2) 75%, rgba(0,0,0,0) 100%)",
          opacity: 0.9,
        }}
      />

      {/* subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.06), rgba(0,0,0,0) 55%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.55), rgba(0,0,0,0) 55%)",
        }}
      />
    </div>
  );
}

/**
 * ✅ Typewriter that rotates phrases:
 * types -> holds -> deletes -> next
 */
function useTypewriterRotate(
  words: string[],
  opts?: {
    typeMs?: number;
    deleteMs?: number;
    holdMs?: number;
    betweenMs?: number;
  }
) {
  const typeMs = opts?.typeMs ?? 40;
  const deleteMs = opts?.deleteMs ?? 24;
  const holdMs = opts?.holdMs ?? 1200;
  const betweenMs = opts?.betweenMs ?? 250;

  const [i, setI] = useState(0);
  const [txt, setTxt] = useState("");
  const [mode, setMode] = useState<"typing" | "holding" | "deleting" | "between">(
    "typing"
  );

  useEffect(() => {
    const word = words[i % words.length];

    if (mode === "typing") {
      if (txt.length < word.length) {
        const t = setTimeout(
          () => setTxt(word.slice(0, txt.length + 1)),
          typeMs
        );
        return () => clearTimeout(t);
      }
      setMode("holding");
      return;
    }

    if (mode === "holding") {
      const t = setTimeout(() => setMode("deleting"), holdMs);
      return () => clearTimeout(t);
    }

    if (mode === "deleting") {
      if (txt.length > 0) {
        const t = setTimeout(
          () => setTxt(word.slice(0, txt.length - 1)),
          deleteMs
        );
        return () => clearTimeout(t);
      }
      setMode("between");
      return;
    }

    // between
    const t = setTimeout(() => {
      setI((x) => (x + 1) % words.length);
      setMode("typing");
    }, betweenMs);
    return () => clearTimeout(t);
  }, [txt, mode, i, words, typeMs, deleteMs, holdMs, betweenMs]);

  // start first word
  useEffect(() => {
    if (!words?.length) return;
  }, [words]);

  return txt || words[0] || "";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="text-white font-semibold">{value}</div>
      <div className="text-zinc-500">{label}</div>
    </div>
  );
}

function MiniRow({ title, meta }: { title: string; meta: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="text-sm text-white">{title}</div>
      <div className="text-xs text-zinc-400">{meta}</div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur">
      <div className="text-white font-semibold">{title}</div>
      <div className="mt-2 text-sm text-zinc-400">{desc}</div>
    </div>
  );
}

function PriceCard({
  name,
  price,
  bullets,
  highlight,
}: {
  name: string;
  price: string;
  bullets: string[];
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border bg-white/5 p-6 ring-1 backdrop-blur",
        highlight
          ? "border-white/20 ring-white/20"
          : "border-white/10 ring-white/10",
      ].join(" ")}
    >
      <div className="text-white font-semibold">{name}</div>
      <div className="mt-2 text-3xl font-semibold text-white">{price}</div>
      <ul className="mt-4 space-y-2 text-sm text-zinc-300">
        {bullets.map((b) => (
          <li key={b} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-300/80" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <a
          href="/login"
          className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-100"
        >
          Start demo
        </a>
      </div>
    </div>
  );
}
