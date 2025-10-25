import express from "express";


import { 
    addLetterhead,
  deleteLetterhead,
  getAllLetterheads,
  getLetterheadByBranch,
   } from "../controllers/letterHeadController.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";

const letterheadRouter = express.Router();

/**
 * Admin routes
 * Prefix: /api/letterhead/admin/
 */
letterheadRouter.post("/admin/add", verifyAdminToken, addLetterhead);
letterheadRouter.get("/admin/list", verifyAdminToken, getAllLetterheads);

letterheadRouter.delete("/admin/delete/:id", verifyAdminToken, deleteLetterhead);

/**
 * Public / Branch routes
 * Prefix: /api/letterhead/
 */
letterheadRouter.get("/branch/:branchId", getLetterheadByBranch);

export default letterheadRouter;
