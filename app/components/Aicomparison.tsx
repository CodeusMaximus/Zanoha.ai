"use client";

import { useEffect, useRef } from "react";
import { X, Check, Database, Calendar, TrendingUp, Phone, Brain, Zap } from "lucide-react";

export default function AIComparison() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const checksRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Dynamically import GSAP to avoid SSR issues
    import("gsap").then((gsapModule) => {
      const gsap = gsapModule.default;
      import("gsap/ScrollTrigger").then((ScrollTriggerModule) => {
        const ScrollTrigger = ScrollTriggerModule.default;
        gsap.registerPlugin(ScrollTrigger);

        // Animate cards on scroll
        cardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.fromTo(
              card,
              {
                opacity: 0,
                y: 60,
                scale: 0.95,
              },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: card,
                  start: "top 85%",
                  end: "top 60%",
                  toggleActions: "play none none reverse",
                },
                delay: index * 0.15,
              }
            );
          }
        });

        // Animate checkmarks with orange glow
        checksRef.current.forEach((check, index) => {
          if (check) {
            gsap.fromTo(
              check,
              {
                scale: 0,
                rotation: -180,
                opacity: 0,
              },
              {
                scale: 1,
                rotation: 0,
                opacity: 1,
                duration: 0.6,
                ease: "back.out(2)",
                scrollTrigger: {
                  trigger: check,
                  start: "top 80%",
                  toggleActions: "play none none reverse",
                },
                delay: index * 0.1,
                onComplete: () => {
                  // Pulse animation
                  gsap.to(check, {
                    scale: 1.1,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut",
                  });
                },
              }
            );
          }
        });
      });
    });
  }, []);

  const addCardRef = (el: HTMLDivElement | null) => {
    if (el && !cardsRef.current.includes(el)) {
      cardsRef.current.push(el);
    }
  };

  const addCheckRef = (el: HTMLDivElement | null) => {
    if (el && !checksRef.current.includes(el)) {
      checksRef.current.push(el);
    }
  };

  const aiFeatures = [
    {
      icon: Brain,
      title: "Knows Your Business",
      description: "Trained on your services, pricing, and policies. Answers questions like your best employee.",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Database,
      title: "Connected to Your CRM",
      description: "Import/export customer data. Recognizes returning clients by phone. Pulls history instantly.",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: Calendar,
      title: "Books Appointments Effortlessly",
      description: "Syncs with Google Calendar, Zoom, Microsoft Teams. Books, reschedules, sends confirmations automatically.",
      gradient: "from-pink-500 to-purple-500",
    },
    {
      icon: TrendingUp,
      title: "Upsells & Reminds",
      description: "Suggests add-ons based on service history. Sends appointment reminders via SMS/email automatically.",
      gradient: "from-purple-500 to-blue-500",
    },
    {
      icon: Phone,
      title: "Outbound Sales Calls",
      description: "Your own AI telemarketing service. Follows up with leads, reactivates dormant clients, promotes specials.",
      gradient: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <section ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
      
      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 backdrop-blur mb-6">
            <Zap className="h-4 w-4" />
            The future is here
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Traditional Receptionist vs{" "}
            <span
              className="inline-block"
              style={{
                backgroundImage: "linear-gradient(90deg, rgba(249,115,22,1), rgba(239,68,68,1))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI Powerhouse
            </span>
          </h2>
          
          <p className="text-xl text-zinc-400 leading-relaxed">
            See why 500+ businesses have made the switch to never miss another opportunity.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-20">
          {/* Traditional Receptionist - BORING */}
          <div
            ref={addCardRef}
            className="rounded-3xl border-2 border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-900/5 p-8 backdrop-blur"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-2xl bg-red-500/10 p-3 ring-2 ring-red-500/20">
                <X className="h-8 w-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Traditional Receptionist</h3>
                <p className="text-sm text-red-400">Limited & Expensive</p>
              </div>
            </div>

            <div className="space-y-4">
              <LimitationItem text="Works 9-5, misses after-hours calls" />
              <LimitationItem text="$35K-45K/year + benefits" />
              <LimitationItem text="Needs training, takes breaks, calls in sick" />
              <LimitationItem text="Can only handle 1 call at a time" />
              <LimitationItem text="Forgets details, makes booking errors" />
              <LimitationItem text="No upselling, no follow-ups" />
              <LimitationItem text="Manual reminders, high no-show rates" />
            </div>

            <div className="mt-8 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
              <div className="text-3xl font-bold text-red-400 mb-1">$45K+/year</div>
              <div className="text-sm text-zinc-400">Plus missed revenue from calls</div>
            </div>
          </div>

          {/* AI Receptionist - AMAZING */}
          <div
            ref={addCardRef}
            className="rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-8 backdrop-blur ring-2 ring-orange-500/20 relative overflow-hidden"
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 blur-3xl opacity-30" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-3 shadow-lg shadow-orange-500/50">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">AI Receptionist</h3>
                  <p className="text-sm text-orange-400">Unlimited & Intelligent</p>
                </div>
              </div>

              <div className="space-y-4">
                <BenefitItem text="24/7/365 - Never misses a call" checkRef={addCheckRef} />
                <BenefitItem text="$297-997/month - 90% cost savings" checkRef={addCheckRef} />
                <BenefitItem text="Instant setup, never sick, no breaks" checkRef={addCheckRef} />
                <BenefitItem text="Handles unlimited simultaneous calls" checkRef={addCheckRef} />
                <BenefitItem text="Perfect recall, zero booking errors" checkRef={addCheckRef} />
                <BenefitItem text="Smart upselling on every call" checkRef={addCheckRef} />
                <BenefitItem text="Auto reminders, 95%+ show rate" checkRef={addCheckRef} />
              </div>

              <div className="mt-8 rounded-2xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 p-4">
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-1">
                  $297/month
                </div>
                <div className="text-sm text-zinc-300 font-semibold">Plus increased revenue from every call</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Superpowers Grid */}
        <div>
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-3">
              What Makes Our AI Different
            </h3>
            <p className="text-lg text-zinc-400">
              Not just an answering service—a complete business growth engine.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiFeatures.slice(0, 3).map((feature, idx) => (
              <FeatureCard key={idx} feature={feature} cardRef={addCardRef} checkRef={addCheckRef} />
            ))}
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mt-6 max-w-4xl mx-auto">
            {aiFeatures.slice(3).map((feature, idx) => (
              <FeatureCard key={idx + 3} feature={feature} cardRef={addCardRef} checkRef={addCheckRef} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col sm:flex-row gap-4">
            <a
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-lg font-bold text-white hover:from-orange-400 hover:to-red-400 transition-all shadow-lg shadow-orange-500/50 hover:scale-105"
            >
              Start Free Demo
              <span className="text-xl">→</span>
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-8 py-4 text-lg font-bold text-white ring-2 ring-white/20 hover:bg-white/15 backdrop-blur transition-all"
            >
              See Pricing
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function LimitationItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 rounded-full bg-red-500/20 p-1">
        <X className="h-4 w-4 text-red-400" />
      </div>
      <span className="text-zinc-300 leading-relaxed">{text}</span>
    </div>
  );
}

function BenefitItem({ text, checkRef }: { text: string; checkRef: (el: HTMLDivElement | null) => void }) {
  return (
    <div className="flex items-start gap-3">
      <div 
        ref={checkRef}
        className="mt-1 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-1 shadow-lg shadow-orange-500/50"
      >
        <Check className="h-4 w-4 text-white stroke-[3]" />
      </div>
      <span className="text-white font-medium leading-relaxed">{text}</span>
    </div>
  );
}

function FeatureCard({ 
  feature, 
  cardRef, 
  checkRef 
}: { 
  feature: any; 
  cardRef: (el: HTMLDivElement | null) => void;
  checkRef: (el: HTMLDivElement | null) => void;
}) {
  const Icon = feature.icon;
  
  return (
    <div
      ref={cardRef}
      className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur hover:bg-white/[0.05] transition-all"
    >
      <div className="flex items-start gap-4 mb-4">
        <div 
          ref={checkRef}
          className={`rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
            {feature.title}
          </h4>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}