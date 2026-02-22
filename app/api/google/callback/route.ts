import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=missing_code", req.url)
      );
    }

    let businessId = "";
    try {
      const parsed = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8")
      );
      businessId = String(parsed?.businessId || "");
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

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.redirect(
        new URL("/dashboard/calendar?google=error&reason=no_refresh_token", req.url)
      );
    }

    // ✅ Get the user's Gmail address
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const googleEmail = userInfo.data.email || "";

    const db = await getDb();

    await db.collection("businesses").updateOne(
      { _id: new ObjectId(businessId) },
      {
        $set: {
          googleRefreshToken: tokens.refresh_token,
          googleEmail: googleEmail, // ✅ Store the Gmail address
          googleStatus: "connected",
          googleConnectedAt: new Date(),
        },
        $unset: {
          googleNeedsReauthAt: "",
        },
      }
    );

    console.log(`✅ Google connected for business ${businessId} with email ${googleEmail}`);

    return NextResponse.redirect(
      new URL("/dashboard/calendar?google=connected", req.url)
    );
  } catch (err) {
    console.error("google callback error:", err);
    return NextResponse.redirect(
      new URL("/dashboard/calendar?google=error&reason=exception", req.url)
    );
  }
}