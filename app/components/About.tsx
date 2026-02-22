"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Target, Zap, TrendingUp, Users, Phone, Calendar, BarChart, Shield } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const root = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!root.current) return;

    const ctx = gsap.context(() => {
      // Respect reduced motion
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
          end: "bottom 30%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out", duration: 0.8 },
      });

      tl.from("[data-about='pill']", { y: 12, opacity: 0 })
        .from("[data-about='title']", { y: 18, opacity: 0 }, "-=0.55")
        .from("[data-about='copy']", { y: 14, opacity: 0, stagger: 0.12 }, "-=0.55")
        .from("[data-about='stat']", { y: 12, opacity: 0, stagger: 0.1 }, "-=0.45");

      // Feature cards stagger + slight scale
      gsap.from("[data-about='card']", {
        scrollTrigger: {
          trigger: "[data-about='cardsWrap']",
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 18,
        scale: 0.98,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      });

      // Bottom banner pop
      gsap.from("[data-about='banner']", {
        scrollTrigger: {
          trigger: "[data-about='banner']",
          start: "top 85%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        y: 18,
        duration: 0.8,
        ease: "power3.out",
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="about" className="relative py-24">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
          {/* Left: Content */}
          <div>
            <div
              data-about="pill"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur mb-6"
            >
              <Target className="h-4 w-4 text-cyan-400" />
              Built for service businesses
            </div>

            <h2
              data-about="title"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
            >
              Phone calls shouldn't be your{" "}
              <span
                className="inline-block"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, rgba(239,68,68,1), rgba(251,146,60,1))",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                biggest weakness
              </span>
            </h2>

            <div className="space-y-5 text-lg text-zinc-300 leading-relaxed">
              <p data-about="copy">
                Most service businesses lose{" "}
                <span className="font-semibold text-white">thousands in revenue</span>{" "}
                every month from missed calls, slow responses, and forgotten follow-ups.
              </p>
              <p data-about="copy">
                Our AI receptionist answers{" "}
                <span className="font-semibold text-white">instantly</span>, qualifies
                customers, books appointments, and updates your CRM—automatically. So
                you can focus on delivering great service.
              </p>
              <p data-about="copy" className="text-zinc-400">
                Designed for barbershops, salons, dentists, clinics, contractors, and
                any business where speed to respond directly impacts revenue.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-6">
              <div data-about="stat">
                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                <div className="text-sm text-zinc-400">Always Available</div>
              </div>
              <div data-about="stat">
                <div className="text-3xl font-bold text-white mb-1">&lt;60s</div>
                <div className="text-sm text-zinc-400">Avg. Booking Time</div>
              </div>
              <div data-about="stat">
                <div className="text-3xl font-bold text-white mb-1">0</div>
                <div className="text-sm text-zinc-400">Missed Calls</div>
              </div>
            </div>
          </div>

          {/* Right: Feature Cards */}
          <div className="relative" data-about="cardsWrap">
            {/* Glow effect */}
            <div className="absolute -inset-8 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-[3rem] blur-3xl opacity-50" />

            <div className="relative grid gap-4">
              {/* Top row */}
              <div className="grid grid-cols-2 gap-4">
                <div data-about="card">
                  <FeatureCard
                    icon={Phone}
                    title="Never Miss a Call"
                    desc="AI answers instantly, every time"
                    gradient="from-cyan-400 to-blue-500"
                  />
                </div>
                <div data-about="card">
                  <FeatureCard
                    icon={Calendar}
                    title="Instant Booking"
                    desc="Calendar sync + confirmations"
                    gradient="from-blue-500 to-purple-500"
                  />
                </div>
              </div>

              {/* Middle row */}
              <div className="grid grid-cols-2 gap-4">
                <div data-about="card">
                  <FeatureCard
                    icon={Users}
                    title="Complete CRM"
                    desc="Customers, leads, outcomes"
                    gradient="from-purple-500 to-pink-500"
                  />
                </div>
                <div data-about="card">
                  <FeatureCard
                    icon={TrendingUp}
                    title="Lead Pipeline"
                    desc="Track & convert automatically"
                    gradient="from-pink-500 to-red-500"
                  />
                </div>
              </div>

              {/* Bottom full-width card */}
              <div
                data-about="card"
                className="relative group rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 ring-1 ring-white/10 backdrop-blur overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 flex items-center justify-center ring-1 ring-white/20">
                    <Shield className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1">Enterprise Security</div>
                    <div className="text-sm text-zinc-400">
                      Bank-level encryption • SOC 2 compliant • HIPAA ready
                    </div>
                  </div>
                  <BarChart className="h-8 w-8 text-zinc-600 group-hover:text-emerald-400/50 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom highlight banner */}
        <div
          data-about="banner"
          className="mt-20 rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-8 backdrop-blur"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white mb-1">
                  Ready to never miss another opportunity?
                </div>
                <div className="text-sm text-zinc-400">
                  Join hundreds of businesses already using AI to scale revenue
                </div>
              </div>
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-black hover:bg-zinc-100 transition-all hover:scale-105 shadow-lg whitespace-nowrap"
            >
              Start Free Trial <span className="text-lg">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
}: {
  icon: any;
  title: string;
  desc: string;
  gradient: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-5 ring-1 ring-white/10 backdrop-blur transition-all hover:border-white/20 hover:bg-white/[0.12]">
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity`}
      />

      <div className="relative">
        <div
          className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} opacity-20 ring-1 ring-white/20 mb-4 group-hover:opacity-30 transition-opacity`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="font-bold text-white mb-1.5 group-hover:text-cyan-100 transition-colors">
          {title}
        </div>
        <div className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
          {desc}
        </div>
      </div>
    </div>
  );
}
