"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Check, Zap, Star, Crown, Sparkles } from "lucide-react";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const root = useRef<HTMLElement | null>(null);

  const plans = useMemo(
    () => [
      {
        name: "Starter",
        description: "Perfect for solo practitioners",
        monthlyPrice: 297,
        annualPrice: 2970, // 10% off
        icon: Sparkles,
        gradient: "from-blue-500 to-cyan-500",
        features: [
          "AI Receptionist (24/7)",
          "Auto booking & calendar sync",
          "Up to 500 calls/month",
          "Basic CRM",
          "Email support",
          "Call transcripts",
        ],
        cta: "Start 7-Day Free Trial",
        popular: false,
      },
      {
        name: "Professional",
        description: "For growing businesses",
        monthlyPrice: 497,
        annualPrice: 4470, // 25% off
        icon: Star,
        gradient: "from-purple-500 to-pink-500",
        features: [
          "Everything in Starter",
          "Unlimited calls",
          "Advanced CRM & pipeline",
          "Lead management & scoring",
          "SMS notifications",
          "Call routing & transfers",
          "Priority support",
          "Custom AI training",
        ],
        cta: "Start 7-Day Free Trial",
        popular: true,
      },
      {
        name: "Enterprise",
        description: "For multi-location teams",
        monthlyPrice: 997,
        annualPrice: 8970, // 25% off
        icon: Crown,
        gradient: "from-orange-500 to-red-500",
        features: [
          "Everything in Professional",
          "Multi-location support",
          "Dedicated account manager",
          "Advanced analytics & reporting",
          "API access",
          "Custom integrations",
          "White-label options",
          "SLA guarantee",
        ],
        cta: "Contact Sales",
        popular: false,
      },
    ],
    []
  );

  useLayoutEffect(() => {
    if (!root.current) return;

    const el = root.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);

      // Initial states (prevents “not animating” in Next)
      gsap.set(q("[data-pr='pill'], [data-pr='title'], [data-pr='sub'], [data-pr='toggle']"), {
        opacity: 0,
        y: 16,
      });
      gsap.set(q("[data-pr='card']"), { opacity: 0, y: 22, scale: 0.985 });
      gsap.set(q("[data-pr='trust'], [data-pr='quick']"), { opacity: 0, y: 18 });

      // Header timeline
      gsap
        .timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 70%",
            toggleActions: "play none none reverse",
            invalidateOnRefresh: true,
            // markers: true,
          },
          defaults: { ease: "power3.out", duration: 0.8 },
        })
        .to(q("[data-pr='pill']"), { opacity: 1, y: 0, duration: 0.6 })
        .to(q("[data-pr='title']"), { opacity: 1, y: 0 }, "-=0.35")
        .to(q("[data-pr='sub']"), { opacity: 1, y: 0, duration: 0.65 }, "-=0.45")
        .to(q("[data-pr='toggle']"), { opacity: 1, y: 0, duration: 0.6 }, "-=0.45");

      // Cards stagger
      gsap.to(q("[data-pr='card']"), {
        scrollTrigger: {
          trigger: q("[data-pr='cards']")[0],
          start: "top 80%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
          // markers: true,
        },
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.12,
      });

      // Trust section
      gsap.to(q("[data-pr='trust']"), {
        scrollTrigger: {
          trigger: q("[data-pr='trust']")[0],
          start: "top 85%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // Quick links
      gsap.to(q("[data-pr='quick']"), {
        scrollTrigger: {
          trigger: q("[data-pr='quick']")[0],
          start: "top 90%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      // Refresh after fonts/layout settle
      requestAnimationFrame(() => ScrollTrigger.refresh());
      setTimeout(() => ScrollTrigger.refresh(), 150);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="pricing" className="relative py-24">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div
            data-pr="pill"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 backdrop-blur mb-6"
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            7-Day Free Trial
          </div>

          <h2
            data-pr="title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
          >
            Simple, transparent{" "}
            <span
              className="inline-block"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(168,85,247,1), rgba(236,72,153,1))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              pricing
            </span>
          </h2>

          <p data-pr="sub" className="text-xl text-zinc-400 leading-relaxed mb-8">
            Start with a 7-day free trial. Cancel anytime.
          </p>

          {/* Annual/Monthly Toggle */}
          <div
            data-pr="toggle"
            className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur"
          >
            <button
              onClick={() => setIsAnnual(false)}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                !isAnnual ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition-all ${
                isAnnual ? "bg-white text-black" : "text-zinc-400 hover:text-white"
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-emerald-400">Save 25%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div data-pr="cards" className="grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const monthlyPrice = isAnnual
              ? Math.round(plan.annualPrice / 12)
              : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                data-pr="card"
                className={`relative rounded-3xl border backdrop-blur transition-all hover:scale-[1.02] ${
                  plan.popular
                    ? "border-purple-500/50 bg-gradient-to-br from-white/[0.08] to-white/[0.02] ring-2 ring-purple-500/20"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg">
                      <Star className="w-3.5 h-3.5 fill-white" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon & Name */}
                  <div className="mb-6">
                    <div
                      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${plan.gradient} opacity-20 ring-1 ring-white/20 mb-4`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-sm text-zinc-400">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-white">${monthlyPrice}</span>
                      <span className="text-zinc-400">/month</span>
                    </div>
                    {isAnnual && (
                      <div className="mt-2 text-sm text-emerald-400">
                        ${price} billed annually
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={plan.name === "Enterprise" ? "#contact" : "/sign-in"}
                    className={`block w-full rounded-xl px-6 py-4 text-center text-base font-bold transition-all mb-8 ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-400 hover:to-pink-400 shadow-lg hover:shadow-purple-500/50"
                        : "bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15"
                    }`}
                  >
                    {plan.cta}
                  </Link>

                  {/* Features */}
                  <div className="space-y-4">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      What's Included
                    </div>
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 rounded-full bg-gradient-to-br ${plan.gradient} p-0.5`}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm text-zinc-300 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust Section */}
        <div
          data-pr="trust"
          className="mt-20 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-12 backdrop-blur text-center"
        >
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              Try it risk-free for 7 days
            </h3>
            <p className="text-lg text-zinc-400 mb-8">
              Start answering calls instantly. Cancel anytime during your trial.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-white mb-2">7 Days</div>
                <div className="text-sm text-zinc-400">Free Trial Period</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">0%</div>
                <div className="text-sm text-zinc-400">Setup Fees</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-sm text-zinc-400">Support Included</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-black hover:bg-zinc-100 transition-all hover:scale-105 shadow-lg"
              >
                Start 7-Day Free Trial <span className="text-lg">→</span>
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-base font-bold text-white ring-1 ring-white/20 hover:bg-white/15 backdrop-blur transition-all"
              >
                Schedule a Demo
              </a>
            </div>
          </div>
        </div>

        {/* FAQ Quick Links */}
        <div data-pr="quick" className="mt-12 text-center">
          <p className="text-sm text-zinc-400 mb-4">Questions about pricing?</p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a href="#faqs" className="text-zinc-300 hover:text-white transition-colors">
              View FAQ
            </a>
            <span className="text-zinc-700">•</span>
            <a href="#contact" className="text-zinc-300 hover:text-white transition-colors">
              Contact Sales
            </a>
            <span className="text-zinc-700">•</span>
            <a href="#" className="text-zinc-300 hover:text-white transition-colors">
              Compare Plans
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
