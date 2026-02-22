"use client";

import { useEffect, useMemo, useState } from "react";

type Opts = {
  typeMs?: number;
  holdMs?: number;
  phaseGapMs?: number;
};

export function useHeroType(opts?: Opts) {
  const typeMs = opts?.typeMs ?? 26;
  const holdMs = opts?.holdMs ?? 700;
  const phaseGapMs = opts?.phaseGapMs ?? 250;

  // Phase 1: bold what it does
  const phase1 = useMemo(
    () => "AI appointment booking + a 24/7 receptionist.",
    []
  );

  // Phase 2: transform into all-in-one statement
  const phase2 = useMemo(
    () => "All in one powerful CRM — lead management & lead generation at its best.",
    []
  );

  const [phase, setPhase] = useState<1 | 2>(1);
  const [text, setText] = useState("");

  useEffect(() => {
    const full = phase === 1 ? phase1 : phase2;

    // type forward until full
    if (text.length < full.length) {
      const t = setTimeout(() => setText(full.slice(0, text.length + 1)), typeMs);
      return () => clearTimeout(t);
    }

    // once typed, hold then switch phase (only once)
    if (phase === 1) {
      const t = setTimeout(() => {
        // small gap then fade transition
        setTimeout(() => {
          setPhase(2);
          setText(""); // re-type phase 2 from empty
        }, phaseGapMs);
      }, holdMs);

      return () => clearTimeout(t);
    }
  }, [text, phase, phase1, phase2, typeMs, holdMs, phaseGapMs]);

  return { phase, text, phase1, phase2 };
}
