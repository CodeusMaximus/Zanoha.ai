/**
 * lib/calendar-helpers.ts
 *
 * Shared calendar utilities - import this in any route that needs calendars
 * Multi-tenant safe: uses refresh token stored per business in MongoDB.
 */

import { google } from "googleapis";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

// In-memory cache: businessId -> calendarId
const calendarCache = new Map<string, string>();

function assertGoogleEnvs() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth envs (CLIENT_ID/SECRET/REDIRECT_URI)");
  }

  return { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI };
}

/**
 * ⚠️ Legacy: shared env refresh token client.
 * Keep only if you *really* still need it for something internal.
 * Prefer getCalendarClientForBusiness() everywhere.
 */
export function getCalendarClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing Google OAuth envs (CLIENT_ID/SECRET/REDIRECT_URI)");
  }
  if (!GOOGLE_REFRESH_TOKEN) throw new Error("Missing GOOGLE_REFRESH_TOKEN");

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * ✅ Tenant-scoped Google Calendar client.
 * Loads the business refresh token from MongoDB: businesses.googleRefreshToken
 * Throws a recognizable error "google_reauth_required" if missing.
 */
export async function getCalendarClientForBusiness(businessId: string) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } =
    assertGoogleEnvs();

  if (!ObjectId.isValid(businessId)) {
    throw new Error("Invalid businessId");
  }

  const db = await getDb();
  const biz = await db.collection("businesses").findOne(
    { _id: new ObjectId(businessId) },
    { projection: { googleRefreshToken: 1 } }
  );

  const refreshToken = (biz as any)?.googleRefreshToken as string | undefined;

  if (!refreshToken) {
    const err: any = new Error("google_reauth_required");
    err.code = "google_reauth_required";
    throw err;
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * ✅ Recommended: when Google returns invalid_grant, mark business as needing reauth
 * and optionally clear the stored refresh token.
 */
export async function markGoogleReauthRequiredForBusiness(
  businessId: string,
  opts?: { clearToken?: boolean }
) {
  if (!ObjectId.isValid(businessId)) return;

  const db = await getDb();

  const update: any = {
    $set: {
      googleStatus: "needs_reauth",
      googleNeedsReauthAt: new Date(),
    },
  };

  if (opts?.clearToken !== false) {
    update.$unset = { googleRefreshToken: "" };
  }

  await db.collection("businesses").updateOne(
    { _id: new ObjectId(businessId) },
    update
  );
}

/**
 * Get or create a Google Calendar for a specific business/tenant
 *
 * This function:
 * 1. Checks if this is the primary tenant (uses GOOGLE_CALENDAR_ID from env)
 * 2. Checks cache for existing mapping
 * 3. Searches Google Calendar for a calendar with this businessId in description
 * 4. Creates new calendar if none found
 * 5. Caches the result
 *
 * @param businessId - The tenant/business ID
 * @param businessName - Optional display name for the calendar
 * @returns Google Calendar ID for this business
 */
export async function getOrCreateCalendarForBusiness(
  businessId: string,
  businessName?: string
): Promise<string> {
  // Primary tenant shortcut (optional)
  const PRIMARY_TENANT_ID =
    process.env.PRIMARY_TENANT_BUSINESS_ID || "696c091c34e3b2e58aa03eea";
  const PRIMARY_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

  if (businessId === PRIMARY_TENANT_ID && PRIMARY_CALENDAR_ID) {
    console.log(
      `✅ Using primary calendar for tenant ${businessId}: ${PRIMARY_CALENDAR_ID}`
    );
    calendarCache.set(businessId, PRIMARY_CALENDAR_ID);
    return PRIMARY_CALENDAR_ID;
  }

  // Cache first
  if (calendarCache.has(businessId)) {
    return calendarCache.get(businessId)!;
  }

  // ✅ Use tenant-scoped client so it works after reconnect
  const calendar = await getCalendarClientForBusiness(businessId);

  try {
    const calendarList = await calendar.calendarList.list();
    const calendars = calendarList.data.items || [];

    const existingCalendar = calendars.find((cal) =>
      cal.description?.includes(`[businessId:${businessId}]`)
    );

    if (existingCalendar?.id) {
      console.log(
        `✅ Found existing calendar for ${businessId}: ${existingCalendar.id}`
      );
      calendarCache.set(businessId, existingCalendar.id);
      return existingCalendar.id;
    }

    console.log(`📅 Creating new calendar for business: ${businessId}`);

    // Prefer a stable timezone rather than Intl.* on server (can be inconsistent)
    const tz = process.env.DEFAULT_TIMEZONE || "America/New_York";

    const newCalendar = await calendar.calendars.insert({
      requestBody: {
        summary: businessName || `Business Calendar - ${businessId.slice(0, 8)}`,
        description: `Auto-created calendar for tenant [businessId:${businessId}]`,
        timeZone: tz,
      },
    });

    const calendarId = newCalendar.data.id!;
    console.log(`✅ Created calendar ${calendarId} for ${businessId}`);

    calendarCache.set(businessId, calendarId);
    return calendarId;
  } catch (err) {
    console.error(`❌ Failed to get/create calendar for ${businessId}:`, err);
    throw err;
  }
}

/**
 * Clear the calendar cache (useful for testing or if calendars are deleted)
 */
export function clearCalendarCache(): void {
  calendarCache.clear();
  console.log("🗑️ Calendar cache cleared");
}
