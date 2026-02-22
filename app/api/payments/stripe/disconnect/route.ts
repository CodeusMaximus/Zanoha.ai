import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import Stripe from "stripe";

export const runtime = "nodejs";

/**
 * GET /api/payments/stripe/callback
 * Handles Stripe Connect OAuth callback
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // This is the businessId
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=invalid_request`
    );
  }

  const businessId = state;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-12-15.clover",
    });

    // Exchange code for access token
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const {
      stripe_user_id, // Connected account ID
      access_token,
      refresh_token,
      stripe_publishable_key,
    } = response;

    // Save to database
    const db = await getDb();
    const settingsCol = db.collection("payment_settings");

    await settingsCol.updateOne(
      { businessId },
      {
        $set: {
          businessId,
          stripe: {
            accountId: stripe_user_id,
            accessToken: access_token,
            refreshToken: refresh_token,
            publishableKey: stripe_publishable_key,
            connectedAt: new Date(),
          },
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(`✅ Stripe connected for business ${businessId}: ${stripe_user_id}`);

    // Redirect back to settings page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?success=stripe`
    );
  } catch (err: any) {
    console.error("Stripe callback error:", err);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?error=connection_failed`
    );
  }
}