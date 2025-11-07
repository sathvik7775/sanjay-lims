import express from "express";
import {
  addLetterhead,
  deleteLetterhead,
  getAllLetterheads,
  getLetterheadByBranch,
  
} from "../controllers/letterHeadController.js"; // ✅ fixed import name
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { letterheadUpload } from "../middlewares/uploadMiddleware.js"; // ✅ renamed for clarity

const letterheadRouter = express.Router();

/**
 * 🔹 ADMIN ROUTES
 * Prefix: /api/letterhead/admin/
 */

// ➕ Add new letterhead (with Cloudinary image upload)
letterheadRouter.post(
  "/admin/add",
  verifyAdminToken,
  letterheadUpload,
  addLetterhead
);



// 📋 Get all letterheads
letterheadRouter.get("/admin/list", verifyAdminToken, getAllLetterheads);

// ❌ Delete letterhead
letterheadRouter.delete("/admin/delete/:id", verifyAdminToken, deleteLetterhead);

/**
 * 🔹 BRANCH / PUBLIC ROUTES
 * Prefix: /api/letterhead/
 */

// 🔍 Get letterhead for a specific branch
letterheadRouter.get(
  "/branch/:branchId",
  
  getLetterheadByBranch
);

export default letterheadRouter;
