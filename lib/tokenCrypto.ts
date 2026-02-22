import crypto from "crypto";

const ALG = "aes-256-gcm";

// Must be 32 bytes once decoded/derived.
function getKey() {
  const raw = process.env.TOKEN_ENC_KEY;
  if (!raw) throw new Error("Missing TOKEN_ENC_KEY env var");

  // Allow either:
  // - 64 hex chars (32 bytes)
  // - any string (we’ll hash to 32 bytes)
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  return crypto.createHash("sha256").update(raw).digest(); // 32 bytes
}

export function encryptText(plain: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Store as: iv.tag.cipher (base64)
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(".");
}

export function decryptText(enc: string) {
  const key = getKey();
  const [ivB64, tagB64, dataB64] = enc.split(".");
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Invalid encrypted payload");

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = crypto.createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);

  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString("utf8");
}
