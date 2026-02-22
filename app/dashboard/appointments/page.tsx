import { connectToDatabase } from "../../../lib/mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";
import { google } from "googleapis";
import AppointmentCard from "@/app/components/AppointmentCard";

export const runtime = "nodejs";

function getCalendarClient() {
  const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_REFRESH_TOKEN,
  } = process.env;

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

export default async function AppointmentsPage() {
  // ✅ active business from cookie + membership check
  const { businessId } = await requireActiveBusinessId();

  const { db } = await connectToDatabase();

  const mongoAppts = await db
    .collection("appointments")
    .find({ businessId }) // ✅ tenant-scoped
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  // ⚠️ Google Calendar events: these are NOT tenant-specific unless you use per-tenant calendarId
  // For now, we’ll still fetch, but mark them "google" and be aware they can show across tenants.
  // Best fix is below in section C.
  let googleEvents: any[] = [];
  try {
    const calendar = getCalendarClient();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "";

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twoWeeksAhead = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const resp = await calendar.events.list({
      calendarId,
      timeMin: twoWeeksAgo.toISOString(),
      timeMax: twoWeeksAhead.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 50,
    });

    googleEvents = (resp.data.items || []).map((e) => ({
      id: e.id,
      source: "google",
      summary: e.summary || "Untitled",
      startISO: e.start?.dateTime || e.start?.date || "",
      endISO: e.end?.dateTime || e.end?.date || "",
      meetLink: e.hangoutLink || "",
      htmlLink: e.htmlLink || "",
      description: e.description || "",
    }));
  } catch (err) {
    console.error("Error fetching Google Calendar:", err);
  }

  const mongoEventIds = new Set(
    mongoAppts.map((a: any) => a.googleEventId).filter(Boolean)
  );
  const filteredGoogleEvents = googleEvents.filter((g) => !mongoEventIds.has(g.id));

  const allAppointments = [
    ...mongoAppts.map((a: any) => ({
      _id: a._id.toString(),
      source: "mongodb",
      customerName: a.customerName || "Unknown",
      phone: a.customerPhone || a.phone || "",
      email: a.attendeeEmail || "",
      service: a.service || "Appointment",
      startISO: a.startISO,
      endISO: a.endISO,
      meetLink: a.meetLink || "",
      htmlLink: a.googleHtmlLink || "",
      googleEventId: a.googleEventId || "",
      notes: a.description || "",
    })),
    ...filteredGoogleEvents.map((g) => ({
      _id: g.id,
      source: "google",
      customerName: g.summary?.split(" - ")[0] || "Unknown",
      phone: "",
      email: "",
      service: g.summary?.split(" - ")[1] || "Appointment",
      startISO: g.startISO,
      endISO: g.endISO,
      meetLink: g.meetLink,
      htmlLink: g.htmlLink,
      googleEventId: g.id,
      notes: g.description || "",
    })),
  ].sort((a, b) => new Date(b.startISO).getTime() - new Date(a.startISO).getTime());

  const now = new Date();
  const upcoming = allAppointments.filter((a) => new Date(a.startISO) >= now);
  const past = allAppointments.filter((a) => new Date(a.startISO) < now);

  return (
    <div className="space-y-6">
      {/* ... keep your UI exactly the same ... */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Appointments</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {upcoming.length} upcoming • {past.length} completed
          </p>
        </div>
      </div>

      {upcoming.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">⏰ Upcoming</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt._id} appointment={appt} isPast={false} />
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-white">✓ Past</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((appt) => (
              <AppointmentCard key={appt._id} appointment={appt} isPast={true} />
            ))}
          </div>
        </div>
      )}

      {allAppointments.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 py-16">
          <div className="text-3xl mb-4">📅</div>
          <p className="text-lg font-medium text-white">No appointments yet</p>
        </div>
      )}
    </div>
  );
}
