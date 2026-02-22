import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "md_admin";
const SECRET = process.env.AUTH_COOKIE_SECRET || "change-me";

function sign(value: string) {
  const h = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(signed: string) {
  const [value, h] = signed.split(".");
  if (!value || !h) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(value).digest("hex");
  if (crypto.timingSafeEqual(Buffer.from(h), Buffer.from(expected))) return value;
  return null;
}

export async function setAdminSession(email: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function getAdminEmail() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

export function isAdminAuthed() {
  return !!getAdminEmail();
}
