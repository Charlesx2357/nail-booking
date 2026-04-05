import crypto from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET");
  }
  return secret;
}

export function isValidAdminLogin(username: string, password: string) {
  return (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  );
}

function sign(value: string) {
  return crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("hex");
}

export function createAdminSession() {
  const payload = "admin";
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifyAdminSession(token?: string) {
  if (!token) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (payload !== "admin") return false;

  const expected = sign(payload);

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
