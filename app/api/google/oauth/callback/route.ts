import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=missing_code_or_state", req.url)
      );
    }

    // ✅ decode state
    let businessId = "";
    let purpose: "calendar" | "gmail" = "calendar";
    let next = "/dashboard/calendar";

    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      businessId = String(parsed?.businessId || "");
      purpose = (String(parsed?.purpose || "calendar").toLowerCase() as any) === "gmail" ? "gmail" : "calendar";
      next = String(parsed?.next || "/dashboard/calendar");
    } catch {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=bad_state", req.url)
      );
    }

    if (!ObjectId.isValid(businessId)) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=bad_business", req.url)
      );
    }

    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=missing_oauth_envs", req.url)
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    const db = await getDb();

    // ✅ Load existing business so we can keep old refresh token if Google doesn't return a new one
    const biz = await db.collection("businesses").findOne({ _id: new ObjectId(businessId) });
    const existingRefresh = biz?.googleRefreshToken || null;

    const refreshToStore = tokens.refresh_token || existingRefresh;

    // If we STILL don't have a refresh token, we can't do server-side API calls long-term
    if (!refreshToStore) {
      const failTo = purpose === "gmail"
        ? "/dashboard/integrations?google=error&reason=no_refresh_token"
        : "/dashboard/calendar?google=error&reason=no_refresh_token";
      return NextResponse.redirect(new URL(failTo, req.url));
    }

    // ✅ update fields based on purpose
    const setFields: any = {
      googleRefreshToken: refreshToStore,
      googleConnectedAt: new Date(),
    };

    if (purpose === "calendar") {
      setFields.googleStatus = "connected";
      setFields.googleNeedsReauthAt = undefined;
    }

    if (purpose === "gmail") {
      setFields.gmailStatus = "connected";
      setFields.gmailConnectedAt = new Date();
    }

    await db.collection("businesses").updateOne(
      { _id: new ObjectId(businessId) },
      {
        $set: setFields,
        $unset: {
          googleNeedsReauthAt: "",
        },
      }
    );

    // ✅ go back to integrations for gmail, calendar page for calendar
    const redirectTo =
      purpose === "gmail"
        ? `${next}?gmail=connected`
        : `${next}?google=connected`;

    return NextResponse.redirect(new URL(redirectTo, req.url));
  } catch (e) {
    console.error("google authcallback error:", e);
    return NextResponse.redirect(
      new URL("/dashboard/calendar?google=error&reason=exception", req.url)
    );
  }
}
