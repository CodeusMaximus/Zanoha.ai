 import { NextResponse } from "next/server";
import { google } from "googleapis";

export const runtime = "nodejs";

function normalizeGoogleAuthError(err: any) {
  const message = String(err?.message || "");
  const code = err?.code;
  const status = err?.response?.status || err?.status;

  // googleapis often nests the useful text here:
  const errorText =
    err?.response?.data?.error_description ||
    err?.response?.data?.error ||
    err?.errors?.[0]?.message ||
    message;

  const isInvalidGrant =
    message.toLowerCase().includes("invalid_grant") ||
    String(errorText).toLowerCase().includes("invalid_grant");

  return {
    isInvalidGrant,
    code,
    status,
    errorText,
  };
}

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const refresh = process.env.GOOGLE_REFRESH_TOKEN;
    if (!refresh) {
      return NextResponse.json(
        { ok: false, error: "Missing GOOGLE_REFRESH_TOKEN" },
        { status: 400 }
      );
    }

    oauth2Client.setCredentials({ refresh_token: refresh });

    // Force refresh
    const accessToken = await oauth2Client.getAccessToken();

    return NextResponse.json({
      ok: true,
      accessTokenExists: !!accessToken?.token,
      // Helpful for debugging without leaking token:
      tokenType: oauth2Client.credentials.token_type || null,
      expiryDate: oauth2Client.credentials.expiry_date || null,
    });
  } catch (err: any) {
    const norm = normalizeGoogleAuthError(err);

    // invalid_grant should be treated as "reauth required"
    const status = norm.isInvalidGrant ? 401 : 500;

    return NextResponse.json(
      {
        ok: false,
        error: norm.isInvalidGrant
          ? "google_reauth_required"
          : "token_refresh_failed",
        google: norm,
      },
      { status }
    );
  }
}
