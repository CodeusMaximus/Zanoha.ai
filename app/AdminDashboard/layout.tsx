import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/mongodb";
import DashboardShell from "@/app/components/DashboardShell";
 


export const runtime = "nodejs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = await getDb();
  const membership = await db.collection("memberships").findOne({ userId });
  if (!membership) redirect("/onboarding");

  return <DashboardShell>{children}</DashboardShell>;
}
