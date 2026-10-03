const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const blackListTokenModel = require("../models/blackListTokenModel");

const adminAuth = async (req, res, next) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const isBlacklisted = await blackListTokenModel.exists({ token });
    if (isBlacklisted) {
      return res.status(401).json({ success: false, message: "Token has been revoked" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded._id || decoded.id).select("+password");

    if (!admin) {
      return res.status(401).json({ success: false, message: "Unauthorized admin access" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: "Admin account is inactive" });
    }

    if (decoded.role && decoded.role !== "admin") {
      return res.status(401).json({ success: false, message: "Unauthorized admin access" });
    }

    req.user = admin;
    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = {
  adminAuth,
};
