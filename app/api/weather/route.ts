import { NextResponse } from "next/server";

export const runtime = "nodejs";

// NWS requires a User-Agent identifying your app + contact
const UA = "ReceptionistCRM/1.0 (support@yourdomain.com)";

async function nwsFetch(url: string) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/geo+json" },
    next: { revalidate: 300 }, // cache 5 min
  });
  if (!r.ok) throw new Error(`NWS ${r.status}`);
  return r.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ ok: false, error: "Missing lat/lon" }, { status: 400 });
    }

    // 1) points -> gives forecast URL
    const points = await nwsFetch(`https://api.weather.gov/points/${lat},${lon}`);

    const props = points?.properties;
    const forecastUrl = props?.forecast;
    const city = props?.relativeLocation?.properties?.city;
    const state = props?.relativeLocation?.properties?.state;

    if (!forecastUrl) throw new Error("No forecast URL");

    // 2) forecast -> periods
    const forecast = await nwsFetch(forecastUrl);
    const period = forecast?.properties?.periods?.[0];

    const summary = period
      ? `${period.name}: ${period.detailedForecast}`
      : "Forecast unavailable";

    return NextResponse.json({
      ok: true,
      location: city && state ? `${city}, ${state}` : "Your area",
      summary,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Weather failed" },
      { status: 500 }
    );
  }
}
