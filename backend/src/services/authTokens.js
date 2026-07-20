import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = "24h"; // fine for a take-home; would be shorter + refresh tokens in production

export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

export function createAccessToken(userId) {
  if (!JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET); // throws on bad signature / expiry
}
