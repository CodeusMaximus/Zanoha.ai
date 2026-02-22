 "use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Star, Quote } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    name: "Marcus Johnson",
    role: "Owner, Elite Cuts Barbershop",
    location: "Atlanta, GA",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 5,
    text: "We went from missing 30% of calls to answering 100%. The AI books appointments while I'm cutting hair. Revenue is up 40% in just 2 months.",
    highlight: "Revenue up 40% in 2 months"
  },
  {
    name: "Sarah Chen",
    role: "Director, Luxe Salon & Spa",
    location: "Los Angeles, CA",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 5,
    text: "Game changer. The AI handles after-hours calls, books appointments, and even sends reminders. Our no-show rate dropped from 25% to under 5%.",
    highlight: "No-shows dropped to 5%"
  },
  {
    name: "David Rodriguez",
    role: "Practice Manager, Smile Dental",
    location: "Miami, FL",
    image: "https://randomuser.me/api/portraits/men/67.jpg",
    rating: 5,
    text: "Best investment we've made. Every call is answered professionally, appointments are booked instantly, and the CRM keeps everything organized. Worth every penny.",
    highlight: "Best investment we've made"
  },
  {
    name: "Jennifer Lee",
    role: "Owner, The Styling Studio",
    location: "Seattle, WA",
    image: "https://randomuser.me/api/portraits/women/68.jpg",
    rating: 5,
    text: "I was skeptical about AI, but this is incredible. Natural conversations, perfect booking accuracy, and clients love the instant response. Can't imagine going back.",
    highlight: "Perfect booking accuracy"
  },
  {
    name: "Robert Kim",
    role: "CEO, MedSpa Solutions",
    location: "New York, NY",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 5,
    text: "Scaled from 1 location to 4 without hiring more staff. The AI handles all our booking calls flawlessly. ROI was positive in the first month.",
    highlight: "ROI positive in month 1"
  },
  {
    name: "Amanda White",
    role: "Owner, White & Co. Salon",
    location: "Chicago, IL",
    image: "https://randomuser.me/api/portraits/women/90.jpg",
    rating: 5,
    text: "My staff can focus on clients instead of answering phones all day. The AI books, confirms, and even reschedules. It's like having a full-time receptionist for a fraction of the cost.",
    highlight: "Like a full-time receptionist"
  },
  {
    name: "Michael Torres",
    role: "Manager, Urban Fitness",
    location: "Austin, TX",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 5,
    text: "Our membership inquiries tripled and every single one gets answered instantly. The AI handles scheduling, FAQs, and tours. Conversion rate went up 60%.",
    highlight: "Conversion up 60%"
  },
  {
    name: "Lisa Patel",
    role: "Owner, Wellness Clinic",
    location: "San Francisco, CA",
    image: "https://randomuser.me/api/portraits/women/26.jpg",
    rating: 5,
    text: "Handles insurance questions, booking follow-ups, and patient reminders perfectly. Our admin costs dropped 70% while patient satisfaction scores hit an all-time high.",
    highlight: "Admin costs down 70%"
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement[]>([]);

  // Infinite scroll animation
  useEffect(() => {
    if (!scrollRef.current) return;

    const scrollContainer = scrollRef.current;
    const scrollContent = scrollContainer.querySelector('[data-scroll-content]') as HTMLElement;
    
    if (!scrollContent) return;

    // Duplicate content for seamless loop
    scrollContent.innerHTML = scrollContent.innerHTML + scrollContent.innerHTML;

    // Animate infinite scroll
    const totalWidth = scrollContent.scrollWidth / 2;
    
    gsap.to(scrollContent, {
      x: -totalWidth,
      duration: 40,
      ease: "none",
      repeat: -1,
    });

    // Pause on hover
    scrollContainer.addEventListener('mouseenter', () => {
      gsap.to(scrollContent, { timeScale: 0, duration: 0.5 });
    });

    scrollContainer.addEventListener('mouseleave', () => {
      gsap.to(scrollContent, { timeScale: 1, duration: 0.5 });
    });
  }, []);

  // Counting animation for stats
  useEffect(() => {
    const ctx = gsap.context(() => {
      statsRef.current.forEach((stat) => {
        if (stat) {
          const target = stat.getAttribute('data-target');
          const suffix = stat.getAttribute('data-suffix') || '';
          
          ScrollTrigger.create({
            trigger: stat,
            start: "top 85%",
            once: true,
            onEnter: () => {
              const obj = { val: 0 };
              gsap.to(obj, {
                val: parseInt(target || '0'),
                duration: 2.5,
                ease: "power2.out",
                onUpdate: () => {
                  stat.textContent = Math.floor(obj.val) + suffix;
                },
              });
            },
          });
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-red-500/5 pointer-events-none" />
      
      <div className="relative mx-auto w-full max-w-[1400px] px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/20 to-red-500/20 px-5 py-2.5 text-sm font-bold text-orange-400 backdrop-blur-xl mb-8 shadow-lg">
            <Star className="h-4 w-4 fill-orange-400" />
            Trusted by 500+ businesses nationwide
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
            Loved by business{" "}
            <span
              className="inline-block"
              style={{
                backgroundImage: "linear-gradient(90deg, rgba(249,115,22,1), rgba(239,68,68,1))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              owners
            </span>
          </h2>
          
          <p className="text-xl text-zinc-300 leading-relaxed font-medium">
            See how our AI receptionist is transforming service businesses across the country.
          </p>
        </div>

        {/* Infinite Scroll Testimonials */}
        <div 
          ref={scrollRef}
          className="relative mb-20 overflow-hidden"
        >
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#070A12] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#070A12] to-transparent z-10" />
          
          <div 
            data-scroll-content
            className="flex gap-6"
          >
            {testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="group flex-shrink-0 w-[650px] rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-xl hover:border-orange-500/30 transition-all hover:scale-[1.02]"
              >
                {/* Quote Icon */}
                <div className="mb-6">
                  <div className="inline-flex rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 p-3 shadow-lg">
                    <Quote className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Text */}
                <p className="text-lg text-white font-medium leading-relaxed mb-6">
                  "{testimonial.text}"
                </p>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 px-4 py-2 text-sm font-bold text-orange-400 mb-6">
                  <Star className="h-4 w-4 fill-orange-400" />
                  {testimonial.highlight}
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="h-16 w-16 rounded-2xl ring-2 ring-white/20 object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-bold text-white mb-1">{testimonial.name}</div>
                    <div className="text-sm text-zinc-400 mb-2">{testimonial.role}</div>
                    <div className="text-xs text-zinc-500">{testimonial.location}</div>
                    
                    {/* Stars - moved here */}
                    <div className="flex gap-1 mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-orange-400 fill-orange-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Animated Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard
            target="500"
            suffix="+"
            label="Active Businesses"
            statRef={(el) => el && statsRef.current.push(el)}
          />
          <StatCard
            target="98"
            suffix="%"
            label="Customer Satisfaction"
            statRef={(el) => el && statsRef.current.push(el)}
          />
          <StatCard
            target="50"
            suffix="K+"
            label="Calls Handled"
            statRef={(el) => el && statsRef.current.push(el)}
          />
          <StatCard
            target="24"
            suffix="/7"
            label="Always Available"
            statRef={(el) => el && statsRef.current.push(el)}
          />
        </div>
      </div>
    </section>
  );
}

function StatCard({
  target,
  suffix,
  label,
  statRef,
}: {
  target: string;
  suffix: string;
  label: string;
  statRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-6 text-center backdrop-blur-xl hover:border-orange-500/30 transition-all group">
      <div
        ref={statRef}
        data-target={target}
        data-suffix={suffix}
        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform"
      >
        0{suffix}
      </div>
      <div className="text-sm text-zinc-400 font-medium">{label}</div>
    </div>
  );
}