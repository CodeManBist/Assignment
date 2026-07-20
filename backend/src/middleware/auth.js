import { verifyAccessToken } from "../services/authTokens.js";
import User from "../models/User.js";

// Every protected route depends on this. It decodes the JWT, loads the
// user, and 401s on anything wrong (missing header, bad signature,
// expired, unknown user). This is the single choke point that makes
// "users only see their own data" enforceable - routes filter every
// query by req.userId from here, never by an id passed in from the client.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ detail: "Not authenticated" });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    return res.status(401).json({ detail: "Could not validate credentials" });
  }

  req.userId = user._id.toString();
  req.userEmail = user.email;
  next();
}
