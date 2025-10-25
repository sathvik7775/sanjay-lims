import express from "express";



import { addResult,
  getResultsByReport,
  updateResult,
  deleteResult,
  getAllResults, } from "../controllers/resultcontroller.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";

const resultRouter = express.Router();

/**
 * 🧪 BRANCH ROUTES
 */

// ➕ Add new result
resultRouter.post("/add", verifyBranchToken, addResult);

// 🔍 Get result by report ID
resultRouter.get("/report/:reportId", verifyBranchToken, getResultsByReport);

// ✏️ Update existing result
resultRouter.put("/update/:reportId", verifyBranchToken, updateResult);

/**
 * 🧾 ADMIN ROUTES
 */

resultRouter.post("/admin/add", verifyAdminToken, addResult);

// 🗑️ Delete result
resultRouter.delete("/admin/delete/:reportId", verifyAdminToken, deleteResult);
resultRouter.get("/admin/report/:reportId", verifyAdminToken, getResultsByReport);
resultRouter.put("/admin/update/:reportId", verifyAdminToken, updateResult);

// 📋 Get all results
resultRouter.get("/admin/all", verifyAdminToken, getAllResults);

export default resultRouter;
