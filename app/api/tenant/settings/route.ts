import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { requireActiveBusinessId } from "@/lib/tenant";

export const runtime = "nodejs";

/* =========================
   TYPES
========================= */

type Department = {
  id: string;
  name: string;
  enabled: boolean;

  action: "collect_message" | "forward" | "live_transfer";
  forwardToE164?: string;
  notes?: string;
};

type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: string;
  enabled: boolean;
};

type BusinessSettingsDoc = {
  businessId: string;

  businessInfo: any;
  businessHours: any;
  notifs: any;
  prefs: any;
  branding: { logoUrl: string | null };

  departments: Department[];
  services: ServiceItem[];

  createdAt: Date;
  updatedAt: Date;
};

/* =========================
   DEFAULT SETTINGS
========================= */

const DEFAULT_SETTINGS = (
  businessId: string
): Omit<BusinessSettingsDoc, "createdAt" | "updatedAt"> => ({
  businessId,

  businessInfo: {
    businessName: "",
    legalName: "",
    businessType: "salon",
    taxId: "",
    phone: "",
    website: "",
    address: { line1: "", line2: "", city: "", state: "", zip: "" },
  },

  businessHours: [
    { day: "Monday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Tuesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Wednesday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Thursday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Friday", enabled: true, open: "09:00", close: "17:00" },
    { day: "Saturday", enabled: false, open: "09:00", close: "17:00" },
    { day: "Sunday", enabled: false, open: "09:00", close: "17:00" },
  ],

  notifs: {
    email: { appointmentBooked: true, missedCall: true, dailySummary: false },
    sms: { appointmentBooked: false, missedCall: true },
    slack: { enabled: false, webhookUrl: "" },
  },

  prefs: {
    timezone: "America/New_York",
    language: "en",
    dateFormat: "MM/DD/YYYY",
    weekStartsOnMonday: false,
    compactMode: false,
  },

  branding: { logoUrl: null },

  departments: [
    {
      id: "frontdesk",
      name: "Front Desk",
      enabled: true,
      action: "collect_message",
      notes: "Default department if caller is unsure.",
    },
  ],

  services: [], // ✅ SERVICES DEFAULT
});

/* =========================
   HELPERS
========================= */

function isE164(n: string) {
  return /^\+\d{10,15}$/.test((n || "").trim());
}

/* =========================
   GET SETTINGS
========================= */

export async function GET() {
  try {
    const { businessId } = await requireActiveBusinessId();
    const db = await getDb();

    const col = db.collection<BusinessSettingsDoc>("business_settings");

    let doc = await col.findOne({ businessId });

    if (!doc) {
      const base = DEFAULT_SETTINGS(businessId);
      const now = new Date();

      await col.insertOne({
        ...base,
        createdAt: now,
        updatedAt: now,
      } as BusinessSettingsDoc);

      doc = await col.findOne({ businessId });
    }

    return NextResponse.json({ ok: true, settings: doc });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE SETTINGS
========================= */

export async function PUT(req: Request) {
  try {
    const { businessId } = await requireActiveBusinessId();
    const db = await getDb();
    const col = db.collection<BusinessSettingsDoc>("business_settings");

    const body = await req.json();

    const departments: Department[] = Array.isArray(body?.departments)
      ? body.departments
      : [];

    const services: ServiceItem[] = Array.isArray(body?.services)
      ? body.services
      : [];

    // Validate departments
    for (const d of departments) {
      if (d?.action === "forward" || d?.action === "live_transfer") {
        if (d.forwardToE164 && !isE164(d.forwardToE164)) {
          return NextResponse.json(
            {
              ok: false,
              error: `Department "${d.name}" forwardToE164 must be E.164 like +13475551234`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Light service validation
    for (const s of services) {
      if (!s.name || !s.description) {
        return NextResponse.json(
          {
            ok: false,
            error: "Each service must include a name and description.",
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    await col.updateOne(
      { businessId },
      {
        $set: {
          businessInfo:
            body?.businessInfo ?? DEFAULT_SETTINGS(businessId).businessInfo,
          businessHours:
            body?.businessHours ?? DEFAULT_SETTINGS(businessId).businessHours,
          notifs: body?.notifs ?? DEFAULT_SETTINGS(businessId).notifs,
          prefs: body?.prefs ?? DEFAULT_SETTINGS(businessId).prefs,
          branding:
            body?.branding ?? DEFAULT_SETTINGS(businessId).branding,

          departments: departments.length
            ? departments
            : DEFAULT_SETTINGS(businessId).departments,

          services: services, // ✅ SERVICES SAVED

          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
