"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function DarkModeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="
        rounded-xl px-3 py-2 text-xs font-semibold ring-1 transition
        bg-zinc-100 text-zinc-900 ring-zinc-200 hover:bg-zinc-200
        dark:bg-white/10 dark:text-white dark:ring-white/15 dark:hover:bg-white/15
      "
    >
      {isDark ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
