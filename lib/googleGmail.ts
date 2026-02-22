import { google } from "googleapis";
import { getDb } from "@/lib/mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";
import { ObjectId } from "mongodb";

export async function getGmailClientForActiveTenant() {
  const { businessId } = await requireActiveBusinessId();
  if (!ObjectId.isValid(businessId)) throw new Error("Bad businessId");

  const db = await getDb();
  const biz = await db
    .collection("businesses")
    .findOne({ _id: new ObjectId(businessId) }, { projection: { googleRefreshToken: 1 } });

  const refresh = biz?.googleRefreshToken as string | undefined;
  if (!refresh) {
    const err: any = new Error("Gmail not connected");
    err.code = "NOT_CONNECTED";
    throw err;
  }

  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI");
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: refresh });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return { gmail };
}
