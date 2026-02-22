"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

function cx(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(" ");
}

const ITEMS = [
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact Us", href: "/#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Detect when footer is visible
  useEffect(() => {
    const handleScroll = () => {
      const footer = document.getElementById("contact");
      if (!footer) return;

      const footerRect = footer.getBoundingClientRect();
      const navbarHeight = 80;
      
      setIsFooterVisible(footerRect.top <= navbarHeight);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40  bg-white/20 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-6 py-4">
          {/* BRAND */}
          <Link href="/" onClick={close} className="group inline-flex items-center gap-3">
            {/* Text logo */}
            <div
              className="
                text-[32px] md:text-[36px]
                font-black
                tracking-[-0.07em]
                bg-gradient-to-l from-orange-500 to-red-500
                bg-clip-text text-transparent
                group-hover:from-orange-500 group-hover:to-red-400
                transition-all
              "
            >
              Zanoha
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            {ITEMS.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className={cx(
                  "group relative rounded-xl px-4 py-2.5 text-lg font-bold hover:text-orange-600 transition-colors",
                  isFooterVisible ? "text-zinc-700" : "text-white"
                )}
              >
                {i.label}
                {/* Orange underline on hover */}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </Link>
            ))}

            <div className="mx-2 h-6 w-px bg-zinc-300" />

            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button className="rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-bold text-zinc-900 hover:bg-zinc-200 transition-colors border-2 border-zinc-200">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="flex md:hidden items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-red-500 p-2.5 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-md"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <div
        className={cx("fixed inset-0 z-[100] md:hidden", open ? "" : "pointer-events-none")}
        aria-hidden={!open}
      >
        {/* Overlay */}
        <div
          className={cx(
            "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={close}
        />

        {/* Panel - FULL HEIGHT AND WIDTH */}
        <div
          className={cx(
            "absolute inset-0 bg-white/95 backdrop-blur-2xl",
            "transition-transform duration-300",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-200/50">
            <div className="text-2xl font-black bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
              Menu
            </div>
            <button
              className="rounded-xl bg-zinc-100 p-3 text-zinc-900 hover:bg-zinc-200 transition-colors"
              onClick={close}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="p-6 space-y-4 overflow-y-auto h-[calc(100vh-88px)]">
            {ITEMS.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={close}
                className="block rounded-2xl bg-white/60 backdrop-blur-xl px-6 py-5 text-lg font-bold text-zinc-800 hover:bg-orange-50 hover:text-orange-600 transition-all shadow-sm"
              >
                {i.label}
              </Link>
            ))}

            <div className="h-px bg-zinc-200/50 my-6" />

            <SignedOut>
              <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button
                  onClick={close}
                  className="w-full rounded-2xl bg-zinc-900 px-6 py-5 text-lg font-bold text-white hover:bg-zinc-800 transition-colors shadow-lg"
                >
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>

            <SignedIn>
              <Link
                href="/dashboard"
                onClick={close}
                className="block w-full rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-5 text-center text-lg font-bold text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-lg"
              >
                Dashboard
              </Link>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/60 backdrop-blur-xl px-6 py-5 shadow-sm">
                <div className="text-lg font-bold text-zinc-800">Account</div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </nav>
        </div>
      </div>
    </>
  );
}