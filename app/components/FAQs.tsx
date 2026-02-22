 "use client";

import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { HelpCircle, CheckCircle } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: "How do I get a phone number for my AI receptionist?",
    a: "You can purchase a dedicated Twilio phone number for just $1/month directly in your back office dashboard. This number is exclusively for your AI receptionist. Alternatively, you can forward/route your existing business phone number to the Twilio number if you prefer to keep your current number."
  },
  {
    q: "Can I use my existing business phone number?",
    a: "Yes! You can keep your existing number and simply route/forward it to your Twilio number. This way, customers call your familiar number, and the AI answers. Setup takes less than 5 minutes and we provide step-by-step instructions for all major carriers."
  },
  {
    q: "What kind of support do you provide?",
    a: "Every customer gets a one-time live setup and walkthrough session with our team to ensure everything is configured perfectly. After that, you have access to ongoing support via email, chat, and phone. We also provide a comprehensive knowledge base and video tutorials."
  },
  {
    q: "Does it integrate with Google Calendar?",
    a: "Yes — seamlessly. The AI books appointments directly into Google Calendar, sends automatic confirmations and reminders, and syncs in real-time. It also works with Zoom, Microsoft Teams, and other calendar platforms."
  },
  {
    q: "Can it handle after-hours calls?",
    a: "Absolutely. The AI answers 24/7/365, including nights, weekends, and holidays. You can set custom availability rules — for example, book appointments during business hours and take messages after hours. It never sleeps, takes breaks, or calls in sick."
  },
  {
    q: "Can I run SMS campaigns?",
    a: "Yes! SMS capabilities are built-in. You can send appointment reminders, promotional campaigns, follow-up messages, and re-engagement campaigns. Fully compliant with SMS regulations and includes opt-out management."
  },
  {
    q: "How does the AI handle complex questions?",
    a: "The AI is trained on your specific business — services, pricing, policies, and FAQs. It can answer detailed questions, handle objections, suggest services, and upsell naturally. For anything it can't handle, it seamlessly transfers to you or takes a detailed message."
  },
  {
    q: "Can I import my existing customer data?",
    a: "Yes — bulk import via CSV is supported. Upload your customer list with tags, notes, and history. The AI will recognize returning customers by phone number and pull up their complete history during calls."
  },
  {
    q: "What if a customer needs to speak to a real person?",
    a: "The AI can transfer calls to you or your team instantly. You control when transfers happen — for emergencies only, specific request types, or VIP customers. The AI provides context before transferring so you know exactly what the customer needs."
  },
  {
    q: "Do you offer lead generation services?",
    a: "Yes — as an optional add-on. We offer curated lead packs for your industry, or you can bring your own leads and we'll enrich them with verified contact data. The AI can then run automated follow-up sequences to convert them."
  },
  {
    q: "What businesses is this for?",
    a: "Any service business that takes appointments: salons, barbershops, spas, dental offices, medical clinics, law firms, contractors, fitness studios, tutors, consultants, and more. If you book appointments and answer calls, this is for you."
  },
  {
    q: "How long does setup take?",
    a: "Most businesses are live within 24 hours. You provide your calendar, business details, and services. We handle the technical setup, AI training, and phone number configuration. Then we schedule your live walkthrough to ensure everything works perfectly."
  },
  {
    q: "Can it handle multiple locations?",
    a: "Yes — the Enterprise plan supports multi-location businesses. Each location can have its own phone number, calendar, services, and pricing while being managed from one central dashboard."
  },
  {
    q: "What happens if the AI makes a mistake?",
    a: "The AI has a 99.8% accuracy rate, but if something goes wrong, you have full call recordings, transcripts, and the ability to manually adjust any booking. We also continuously monitor and improve the AI based on your feedback."
  },
  {
    q: "Can I customize what the AI says?",
    a: "Absolutely. You control the AI's personality, greeting, hold messages, and responses. Make it formal, casual, funny, or professional — whatever matches your brand. You can update the script anytime in your dashboard."
  },
  {
    q: "Is my data secure and private?",
    a: "Yes. We're SOC 2 compliant and HIPAA-ready. All data is encrypted at rest and in transit. We never sell or share your customer data. You can export or delete all data anytime."
  },
  {
    q: "What's included in the free demo calls?",
    a: "Each plan includes 25-50 free demo calls so you can test the AI with real customers before committing. These don't count toward your monthly usage — they're just for you to see it in action."
  },
  {
    q: "Can the AI upsell services?",
    a: "Yes — it's trained to identify upsell opportunities based on the customer's history and the services they're booking. It suggests add-ons naturally during conversation, which typically increases average ticket size by 25-40%."
  },
  {
    q: "What if I want to cancel?",
    a: "You can cancel anytime — no contracts, no cancellation fees. We offer a 30-day money-back guarantee. If you're not satisfied in the first month, we'll refund your payment, no questions asked."
  },
  {
    q: "Do you integrate with other software?",
    a: "Yes — we integrate with popular tools like Zapier, Stripe, QuickBooks, Square, and more. Custom integrations are available on Enterprise plans. Our API is also available for developers."
  },
];

export default function FAQs() {
  const [open, setOpen] = useState<number | null>(0);
  const root = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!root.current) return;

    const el = root.current;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(el);

      gsap.set(q("[data-faq='pill'], [data-faq='title'], [data-faq='sub'], [data-faq='cta']"), {
        opacity: 0,
        y: 16,
      });
      gsap.set(q("[data-faq='item']"), { opacity: 0, y: 18 });

      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 70%",
          end: "bottom 40%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
        defaults: { ease: "power3.out", duration: 0.8 },
      })
        .to(q("[data-faq='pill']"), { opacity: 1, y: 0, duration: 0.6 })
        .to(q("[data-faq='title']"), { opacity: 1, y: 0 }, "-=0.35")
        .to(q("[data-faq='sub']"), { opacity: 1, y: 0, duration: 0.6 }, "-=0.45");

      gsap.to(q("[data-faq='item']"), {
        scrollTrigger: {
          trigger: q("[data-faq='list']")[0],
          start: "top 80%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.09,
      });

      gsap.to(q("[data-faq='cta']"), {
        scrollTrigger: {
          trigger: q("[data-faq='cta']")[0],
          start: "top 88%",
          toggleActions: "play none none reverse",
          invalidateOnRefresh: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
      setTimeout(() => ScrollTrigger.refresh(), 150);
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="faqs" className="relative py-24">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-[1000px] px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div
            data-faq="pill"
            className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-5 py-2.5 text-sm font-bold text-orange-400 backdrop-blur-xl mb-8"
          >
            <HelpCircle className="h-4 w-4" />
            Got questions?
          </div>

          <h2
            data-faq="title"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6"
          >
            Everything You{" "}
            <span
              className="inline-block"
              style={{
                backgroundImage: "linear-gradient(90deg, rgba(249,115,22,1), rgba(239,68,68,1))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Need to Know
            </span>
          </h2>

          <p data-faq="sub" className="text-xl text-zinc-300 font-medium leading-relaxed">
            Common questions about setup, pricing, features, and support — all answered.
          </p>
        </div>

        {/* FAQ List */}
        <div data-faq="list" className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = open === idx;
            return (
              <div
                data-faq="item"
                key={item.q}
                className={`group rounded-2xl border-2 transition-all ${
                  isOpen
                    ? "border-orange-500/40 bg-gradient-to-br from-white/[0.10] to-white/[0.05] shadow-lg shadow-orange-500/10"
                    : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-orange-500/20"
                } backdrop-blur`}
              >
                <button
                  className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left"
                  onClick={() => setOpen(isOpen ? null : idx)}
                >
                  <div className="flex items-start gap-5 flex-1">
                    <div
                      className={`mt-1 transition-all ${
                        isOpen ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-70"
                      }`}
                    >
                      <CheckCircle className="h-6 w-6 text-orange-400" />
                    </div>

                    <div
                      className={`text-lg font-bold transition-colors leading-tight ${
                        isOpen ? "text-white" : "text-zinc-200 group-hover:text-white"
                      }`}
                    >
                      {item.q}
                    </div>
                  </div>

                  {/* Animated Circle Cross Spinner */}
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <svg
                      className={`absolute inset-0 transition-all duration-500 ${
                        isOpen ? "rotate-90 opacity-100" : "rotate-0 opacity-70 group-hover:opacity-100"
                      }`}
                      viewBox="0 0 40 40"
                      fill="none"
                    >
                      {/* Outer Circle */}
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`transition-colors ${
                          isOpen ? "text-orange-500" : "text-zinc-600 group-hover:text-orange-400"
                        }`}
                      />
                      
                      {/* Horizontal Line */}
                      <line
                        x1="12"
                        y1="20"
                        x2="28"
                        y2="20"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className={`transition-all duration-300 ${
                          isOpen ? "text-orange-500" : "text-zinc-500 group-hover:text-orange-400"
                        }`}
                      />
                      
                      {/* Vertical Line - rotates to form X */}
                      <line
                        x1="20"
                        y1="12"
                        x2="20"
                        y2="28"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className={`origin-center transition-all duration-300 ${
                          isOpen ? "text-orange-500 rotate-90 opacity-0" : "text-zinc-500 group-hover:text-orange-400 rotate-0 opacity-100"
                        }`}
                      />
                    </svg>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="px-8 pb-6 pl-[68px]">
                      <div className="text-base text-zinc-300 leading-relaxed border-l-2 border-orange-400/40 pl-5 font-medium">
                        {item.a}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div data-faq="cta" className="mt-16 text-center">
          <div className="rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-8 backdrop-blur-xl">
            <p className="text-lg font-bold text-white mb-2">Still have questions?</p>
            <p className="text-sm text-zinc-300 mb-6">Our team is here to help you get started</p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-8 py-4 text-base font-bold text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg hover:scale-105"
            >
              Contact Our Team
              <span className="text-xl">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}