import { Router } from "express";
import User from "../models/User.js";
import { hashPassword, verifyPassword, createAccessToken } from "../services/authTokens.js";

const router = Router();

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post("/signup", async (req, res) => {
  const { email, password } = req.body || {};

  if (!isValidEmail(email)) {
    return res.status(422).json({ detail: "A valid email is required" });
  }
  if (typeof password !== "string" || password.length < 8) {
    return res.status(422).json({ detail: "Password must be at least 8 characters" });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ detail: "An account with this email already exists" });
  }

  const user = await User.create({
    email: email.toLowerCase(),
    hashedPassword: await hashPassword(password),
  });

  const token = createAccessToken(user._id.toString());
  res.json({ access_token: token, token_type: "bearer" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  // Deliberately identical error for "no such user" and "wrong password" -
  // don't leak which emails are registered.
  const invalid = () => res.status(401).json({ detail: "Invalid email or password" });

  if (!isValidEmail(email) || typeof password !== "string") {
    return invalid();
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await verifyPassword(password, user.hashedPassword))) {
    return invalid();
  }

  const token = createAccessToken(user._id.toString());
  res.json({ access_token: token, token_type: "bearer" });
});

export default router;
