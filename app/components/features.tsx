 "use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Phone,
  Calendar,
  Users,
  TrendingUp,
  MessageSquare,
  Database,
  Sparkles,
  Zap,
  Shield,
  Brain,
  Clock,
  Target,
  BarChart3,
  Bell,
  Globe,
  Headphones,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: "AI Receptionist That Never Sleeps",
    desc: "Answers every call 24/7/365 in under 2 seconds. Handles unlimited simultaneous calls while your competition sends callers to voicemail. Every conversation is natural, professional, and perfectly on-brand.",
    icon: Phone,
    gradient: "from-orange-500 to-red-500",
    stats: "100% Call Coverage",
  },
  {
    title: "Smart Calendar Integration",
    desc: "Books appointments directly into Google Calendar, Zoom, Microsoft Teams. Auto-sends confirmations, reminders, and handles rescheduling. Syncs in real-time across all your platforms.",
    icon: Calendar,
    gradient: "from-red-500 to-pink-500",
    stats: "95% Show-Up Rate",
  },
  {
    title: "Complete CRM & Customer Intel",
    desc: "Recognizes returning customers by phone number. Pulls full history, preferences, and notes instantly. Tracks every interaction, outcome, and conversation for perfect follow-up.",
    icon: Users,
    gradient: "from-pink-500 to-purple-500",
    stats: "Zero Data Loss",
  },
  {
    title: "Intelligent Lead Management",
    desc: "Automatically scores and routes leads. Tracks pipeline stages, conversion rates, and ROI. Sends hot leads to your phone immediately while nurturing cold ones automatically.",
    icon: TrendingUp,
    gradient: "from-purple-500 to-blue-500",
    stats: "3x Lead Conversion",
  },
  {
    title: "AI-Powered Conversations",
    desc: "Full transcript of every call with sentiment analysis. AI identifies upsell opportunities, objections, and buying signals. Learns from every conversation to improve over time.",
    icon: MessageSquare,
    gradient: "from-blue-500 to-cyan-500",
    stats: "100% Accuracy",
  },
  {
    title: "Database Sync & Import/Export",
    desc: "Connect your existing customer database instantly. Import from CSV, export anytime. Two-way sync keeps everything current. Never re-enter data again.",
    icon: Database,
    gradient: "from-cyan-500 to-teal-500",
    stats: "Instant Migration",
  },
  {
    title: "Smart Upselling Engine",
    desc: "AI suggests relevant add-ons based on service history and customer profile. Increases average ticket by 25-40%. Natural recommendations that don't feel pushy.",
    icon: Target,
    gradient: "from-teal-500 to-green-500",
    stats: "+35% Revenue",
  },
  {
    title: "Advanced Analytics Dashboard",
    desc: "Real-time insights on call volume, booking rates, revenue trends. Identify peak hours, popular services, and growth opportunities. Data-driven decisions made easy.",
    icon: BarChart3,
    gradient: "from-green-500 to-lime-500",
    stats: "Live Reporting",
  },
  {
    title: "Automated Reminders & Follow-Ups",
    desc: "Send SMS and email reminders automatically. Follow up with no-shows, request reviews, and reactivate dormant clients. Set it once, forget it forever.",
    icon: Bell,
    gradient: "from-lime-500 to-yellow-500",
    stats: "80% Response Rate",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const iconsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduceMotion) return;

    const ctx = gsap.context(() => {
      // Crazy header entrance
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      });

      tl.fromTo(
        "[data-features='badge']",
        { scale: 0, rotation: -180, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.6, ease: "back.out(2)" }
      )
        .fromTo(
          "[data-features='title']",
          { x: -100, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
          "-=0.3"
        )
        .fromTo(
          "[data-features='desc']",
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
          "-=0.5"
        );

      // Cards with 3D flip effect
      cardsRef.current.forEach((card, index) => {
        if (card) {
          gsap.fromTo(
            card,
            {
              opacity: 0,
              rotationY: -90,
              z: -200,
            },
            {
              opacity: 1,
              rotationY: 0,
              z: 0,
              duration: 1,
              ease: "power3.out",
              scrollTrigger: {
                trigger: card,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
              delay: index * 0.1,
            }
          );
        }
      });

      // Icons spin and glow on scroll
      iconsRef.current.forEach((icon, index) => {
        if (icon) {
          gsap.fromTo(
            icon,
            {
              rotation: -360,
              scale: 0,
              opacity: 0,
            },
            {
              rotation: 0,
              scale: 1,
              opacity: 1,
              duration: 1.2,
              ease: "elastic.out(1, 0.5)",
              scrollTrigger: {
                trigger: icon,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
              delay: index * 0.05,
              onComplete: () => {
                // Continuous float animation
                gsap.to(icon, {
                  y: -10,
                  duration: 2,
                  ease: "sine.inOut",
                  yoyo: true,
                  repeat: -1,
                });
              },
            }
          );
        }
      });

      // Stats counter animation
      gsap.utils.toArray("[data-stat]").forEach((stat: any) => {
        gsap.fromTo(
          stat,
          { scale: 0, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            ease: "back.out(3)",
            scrollTrigger: {
              trigger: stat,
              start: "top 85%",
            },
          }
        );
      });

      // Bottom CTA with bounce
      gsap.fromTo(
        "[data-features='cta']",
        { y: 50, opacity: 0, scale: 0.8 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: "[data-features='cta']",
            start: "top 90%",
          },
        }
      );

      // Floating orbs background animation
      gsap.to("[data-orb]", {
        y: "random(-20, 20)",
        x: "random(-20, 20)",
        duration: "random(3, 5)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.3,
          from: "random",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          data-orb
          className="absolute top-20 left-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute bottom-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"
        />
        <div
          data-orb
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div
            data-features="badge"
            className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-5 py-2.5 text-sm font-bold text-orange-400 backdrop-blur-xl mb-8 shadow-lg shadow-orange-500/20"
          >
            <Sparkles className="h-4 w-4" />
            The Complete AI Business Suite
          </div>

          <h2
            data-features="title"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-8 leading-tight"
          >
            Everything you need to{" "}
            <span
              className="inline-block relative"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(249,115,22,1), rgba(239,68,68,1), rgba(236,72,153,1))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              dominate your market
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
            </span>
          </h2>

          <p
            data-features="desc"
            className="text-xl sm:text-2xl text-zinc-300 leading-relaxed font-medium"
          >
            Not just an answering service. A complete revenue-generating machine that works 24/7 to grow your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-20">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                ref={(el) => {
                  if (el && !cardsRef.current.includes(el)) {
                    cardsRef.current.push(el);
                  }
                }}
                className="group relative rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-xl transition-all hover:border-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/20 hover:-translate-y-2 will-change-transform"
                style={{ perspective: "1000px" }}
              >
                {/* Animated gradient glow */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl`}
                />

                {/* Icon with crazy animations */}
                <div className="relative mb-6">
                  <div
                    ref={(el) => {
                      if (el && !iconsRef.current.includes(el)) {
                        iconsRef.current.push(el);
                      }
                    }}
                    className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} shadow-xl`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Stat badge */}
                  <div
                    data-stat
                    className="absolute -top-2 -right-2 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg"
                  >
                    {f.stats}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-orange-300 transition-colors">
                  {f.title}
                </h3>
                <p className="text-base text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">
                  {f.desc}
                </p>

                {/* Animated bottom line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-3xl`}
                />

                {/* Corner accent */}
                <div className="absolute top-4 right-4 h-12 w-12 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Zap className="h-full w-full text-orange-500/20" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Power Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <StatCard number="500+" label="Active Businesses" />
          <StatCard number="100K+" label="Calls Handled" />
          <StatCard number="98%" label="Customer Satisfaction" />
          <StatCard number="24/7" label="Always Available" />
        </div>

        {/* Bottom CTA */}
        <div data-features="cta" className="text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-r from-emerald-500/20 to-green-500/20 px-8 py-4 text-base font-bold text-emerald-300 backdrop-blur-xl shadow-lg shadow-emerald-500/20">
            <Shield className="h-5 w-5" />
            Bank-Level Security • SOC 2 Compliant • HIPAA Ready
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 text-center backdrop-blur-xl">
      <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-sm text-zinc-400 font-medium">{label}</div>
    </div>
  );
}