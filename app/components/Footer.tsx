 "use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Mail, MapPin, Phone, Instagram, Twitter, Youtube, Linkedin, Send, Sparkles } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

export default function Footer() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const socialRefs = useRef<HTMLAnchorElement[]>([]);
  const scrollTextRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setTimeout(() => {
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 2000);
    }, 1000);
  };

  // Animate social icons
  useEffect(() => {
    socialRefs.current.forEach((icon, idx) => {
      if (icon) {
        gsap.to(icon, {
          y: -8,
          duration: 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: idx * 0.2,
        });
      }
    });
  }, []);

  // Horizontal scroll text animation
  useEffect(() => {
    if (!scrollTextRef.current) return;

    const scrollText = scrollTextRef.current;

    gsap.to(scrollText, {
      x: "-50%",
      duration: 20,
      ease: "none",
      repeat: -1,
    });
  }, []);

  return (
    <footer id="footer" className="relative bg-gradient-to-b from-zinc-50 to-white border-t-2 border-zinc-200 min-h-screen flex flex-col">
      {/* HUGE SCROLLING TEXT */}
      <div className="w-full overflow-hidden py-16 border-b-2 border-zinc-200">
        <div
          ref={scrollTextRef}
          className="whitespace-nowrap"
          style={{ width: "200%" }}
        >
          <span className="inline-block text-[12vw] md:text-[100vw] lg:text-[8vw] font-black text-zinc-900 tracking-tight">
            Let's Talk: Support@Zanoha.AI • Let's Talk: Support@Zanoha.AI • Let's Talk: Support@Zanoha.AI • Let's Talk: Support@Zanoha.AI • 
          </span>
        </div>
      </div>

      {/* MAIN FOOTER CONTENT */}
      <div className="flex-1 w-full px-6 py-16">
        
        {/* 4 Column Layout */}
        <div className="mx-auto max-w-[1400px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* COLUMN 1: Contact Form */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border-2 border-orange-500/30 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-xl font-bold text-zinc-900">Let's Connect</div>
                  <div className="text-sm text-zinc-600">Get your demo today</div>
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleSubmit}>
                <input
                  required
                  placeholder="Your Name"
                  disabled={status !== "idle"}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-200 focus:border-orange-500 disabled:opacity-50"
                />
                
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  disabled={status !== "idle"}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-200 focus:border-orange-500 disabled:opacity-50"
                />

                <input
                  placeholder="Business Name"
                  disabled={status !== "idle"}
                  className="w-full rounded-xl px-4 py-3 text-sm font-medium outline-none border-2 transition bg-white text-zinc-900 placeholder:text-zinc-400 border-zinc-200 focus:border-orange-500 disabled:opacity-50"
                />

                <button
                  type="submit"
                  disabled={status !== "idle"}
                  className={cx(
                    "w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold transition-all shadow-lg",
                    status === "sent"
                      ? "bg-emerald-500 text-white"
                      : status === "sending"
                      ? "bg-orange-400 text-white"
                      : "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:scale-105"
                  )}
                >
                  {status === "sent" ? (
                    <>
                      <span>Message Sent!</span>
                      <span>✓</span>
                    </>
                  ) : status === "sending" ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Get Your Demo</span>
                    </>
                  )}
                </button>

                <div className="text-xs text-zinc-500 text-center">
                  Response within 24 hours guaranteed
                </div>
              </form>
            </div>
          </div>

          {/* COLUMN 2: Brand + Contact Info */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div className="leading-tight">
                <div className="text-2xl font-bold text-zinc-900">Zanoha</div>
                <div className="text-sm text-zinc-600 font-medium">AI Business Suite</div>
              </div>
            </div>

            <p className="text-sm text-zinc-700 leading-relaxed mb-6 font-medium">
              Never miss another call. AI answers 24/7, books appointments, and manages your entire customer pipeline automatically.
            </p>

            <div className="space-y-3">
              <a href="tel:5550000000" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-orange-600 transition-colors group font-medium">
                <div className="rounded-lg bg-orange-100 p-2.5 group-hover:bg-orange-200 transition-colors">
                  <Phone className="h-4 w-4 text-orange-600" />
                </div>
                (555) 000-0000
              </a>
              
              <a href="mailto:Support@Zanoha.AI" className="flex items-center gap-3 text-sm text-zinc-700 hover:text-orange-600 transition-colors group font-medium">
                <div className="rounded-lg bg-orange-100 p-2.5 group-hover:bg-orange-200 transition-colors">
                  <Mail className="h-4 w-4 text-orange-600" />
                </div>
                Support@Zanoha.AI
              </a>
              
              <div className="flex items-center gap-3 text-sm text-zinc-600 font-medium">
                <div className="rounded-lg bg-zinc-100 p-2.5">
                  <MapPin className="h-4 w-4 text-zinc-600" />
                </div>
                New York, NY
              </div>
            </div>
          </div>

          {/* COLUMN 3: Quick Links */}
          <div>
            <div className="text-lg font-bold text-zinc-900 mb-6">Quick Links</div>
            
            <div className="space-y-6">
              <div>
                <div className="text-sm font-bold text-orange-600 mb-3 uppercase tracking-wide">Product</div>
                <div className="space-y-2.5 text-sm">
                  <Link className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="/#features">Features</Link>
                  <Link className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="/#pricing">Pricing</Link>
                  <Link className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="/#faqs">FAQs</Link>
                  <Link className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="/dashboard">Dashboard</Link>
                </div>
              </div>

              <div>
                <div className="text-sm font-bold text-orange-600 mb-3 uppercase tracking-wide">Company</div>
                <div className="space-y-2.5 text-sm">
                  <Link className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="/#about">About Us</Link>
                  <a className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="#">Privacy Policy</a>
                  <a className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="#">Terms of Service</a>
                  <a className="block text-zinc-700 hover:text-orange-600 transition-colors font-medium" href="#">Contact</a>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 4: Social Media - LARGE ANIMATED */}
          <div>
            <div className="text-lg font-bold text-zinc-900 mb-6">Follow Us</div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { Icon: Instagram, label: "Instagram", href: "#", color: "from-pink-500 to-purple-600" },
                { Icon: Twitter, label: "Twitter", href: "#", color: "from-blue-400 to-cyan-500" },
                { Icon: Youtube, label: "YouTube", href: "#", color: "from-red-500 to-pink-500" },
                { Icon: Linkedin, label: "LinkedIn", href: "#", color: "from-blue-600 to-blue-500" },
              ].map(({ Icon, label, href, color }, idx) => (
                <a
                  key={label}
                  ref={(el) => {
                    if (el && !socialRefs.current.includes(el)) {
                      socialRefs.current.push(el);
                    }
                  }}
                  href={href}
                  aria-label={label}
                  className="group relative h-24 rounded-2xl bg-white border-2 border-zinc-200 hover:border-orange-500 transition-all overflow-hidden shadow-md hover:shadow-xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  
                  <div className="relative h-full w-full flex flex-col items-center justify-center gap-2">
                    <Icon className="h-8 w-8 text-zinc-700 group-hover:text-white transition-colors duration-300" />
                    <span className="text-xs font-bold text-zinc-700 group-hover:text-white transition-colors duration-300">
                      {label}
                    </span>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-orange-50 border-2 border-orange-200 p-4">
              <div className="text-sm font-bold text-orange-900 mb-1">Stay Updated</div>
              <div className="text-xs text-orange-700">
                Follow us for tips, updates, and industry insights
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mx-auto max-w-[1400px] pt-8 border-t-2 border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-600 font-medium">
            © {new Date().getFullYear()} Zanoha. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm font-medium">
            <a href="#" className="text-zinc-600 hover:text-orange-600 transition-colors">Privacy</a>
            <span className="text-zinc-300">•</span>
            <a href="#" className="text-zinc-600 hover:text-orange-600 transition-colors">Terms</a>
            <span className="text-zinc-300">•</span>
            <a href="#" className="text-zinc-600 hover:text-orange-600 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}