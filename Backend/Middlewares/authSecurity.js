const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

const authCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "none" : "strict",
  secure: isProduction,
  path: "/",
};

const setAuthCookie = (res, token) => {
  res.cookie("token", token, authCookieOptions);
};

const clearAuthCookie = (res) => {
  res.clearCookie("token", authCookieOptions);
};

const requireTrustedOrigin = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const origin = req.get("Origin");
  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "Request origin is not allowed",
    });
  }

  return next();
};

module.exports = {
  allowedOrigins,
  authCookieOptions,
  setAuthCookie,
  clearAuthCookie,
  requireTrustedOrigin,
};
