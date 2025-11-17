import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyBranchToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ❗ Prevent verifying "null" or "undefined"
  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ") ||
    authHeader.split(" ")[1] === "null" ||
    authHeader.split(" ")[1] === "undefined"
  ) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "branch") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    req.branch = decoded;
    req.userType = "branch";
    req.branchId = decoded.branchId;

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
