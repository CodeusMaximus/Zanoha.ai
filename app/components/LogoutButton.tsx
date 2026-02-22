"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold
                   text-white-700 bg-black hover:bg-black/5 hover:text-zinc-900
                   dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </SignOutButton>
  );
}
