import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { createCase, 
    updateCase,
  getAllCases,
  getCasesByBranch,
  getCaseById,
  deleteCase,
 } from "../controllers/caseController.js";


const caseRouter = express.Router();

/**
 * ------------------------------
 * CASE ROUTES
 * ------------------------------
 */

// ------------------ Branch Routes ------------------

// Branch creates a new case
caseRouter.post("/branch/add", verifyBranchToken, createCase);

// Branch lists cases for their branch
caseRouter.get("/branch/list/:branchId", verifyBranchToken, getCasesByBranch);

// Branch gets single case by ID
caseRouter.get("/branch/:id", verifyBranchToken, getCaseById);

// Branch updates a case
caseRouter.put("/branch/edit/:id", verifyBranchToken, updateCase);

// ------------------ Admin Routes ------------------

// Admin creates a new case globally
caseRouter.post("/admin/add", verifyAdminToken, createCase);

// Admin lists all cases
caseRouter.get("/admin/list", verifyAdminToken, getAllCases);

// Admin gets a single case by ID
caseRouter.get("/admin/:id", verifyAdminToken, getCaseById);

// Admin edits a case
caseRouter.put("/admin/edit/:id", verifyAdminToken, updateCase);

// Admin deletes a case
caseRouter.delete("/admin/delete/:id", verifyAdminToken, deleteCase);

export default caseRouter;
