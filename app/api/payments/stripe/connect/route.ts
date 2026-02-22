import { NextRequest, NextResponse } from "next/server";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

/**
 * POST /api/payments/stripe/connect
 * Initiates Stripe Connect OAuth flow
 */
export async function POST(req: NextRequest) {
  let businessId = "";
  try {
    const r = await requireActiveBusinessId();
    businessId = String(r?.businessId || "");
    if (!businessId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      STRIPE_CLIENT_ID,
      NEXT_PUBLIC_APP_URL,
    } = process.env;

    if (!STRIPE_CLIENT_ID) {
      return NextResponse.json(
        { success: false, error: "Stripe not configured" },
        { status: 500 }
      );
    }

    const redirectUri = `${NEXT_PUBLIC_APP_URL}/api/payments/stripe/callback`;

    // Build Stripe Connect OAuth URL
    const params = new URLSearchParams({
      client_id: STRIPE_CLIENT_ID,
      state: businessId, // Pass businessId as state to retrieve after OAuth
      scope: "read_write",
      redirect_uri: redirectUri,
      response_type: "code",
    });

    const oauthUrl = `https://connect.stripe.com/oauth/authorize?${params.toString()}`;

    return NextResponse.json({
      success: true,
      url: oauthUrl,
    });
  } catch (err: any) {
    console.error("Stripe connect error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to connect" },
      { status: 500 }
    );
  }
}