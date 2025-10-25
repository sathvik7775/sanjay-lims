import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import {
  addTest,
  listGlobalTests,
  deleteTest,
  handleTestRequest,
  listTestRequests,
  editTest,
  getTestById,
  getReferenceRangesByTestId,
  addReferenceRanges,
  updateReferenceRange,
  deleteReferenceRange,
  listReferenceRanges,
} from "../controllers/testController.js";


const testRouter = express.Router();

/**
 * ------------------------------
 * GLOBAL TEST ROUTES
 * ------------------------------
 */

// Branch adds test request, Admin adds directly
testRouter.post("/add", verifyBranchToken, addTest); // branch sends request
testRouter.post("/admin/add", verifyAdminToken, addTest); // admin adds global

// List global tests (for both admin and branch)
testRouter.get("/list", verifyBranchToken, listGlobalTests);
testRouter.get("/admin/list", verifyAdminToken, listGlobalTests);

// Admin deletes a global test
testRouter.delete("/admin/delete/:id", verifyAdminToken, deleteTest);

// Admin edits a global test
testRouter.put("/admin/edit/:id", verifyAdminToken, editTest);

// Get a single test by ID (admin only)
testRouter.get("/admin/test/:id", verifyAdminToken, getTestById);
testRouter.get("/test/:id", verifyBranchToken, getTestById);

/**
 * ------------------------------
 * BRANCH TEST REQUEST ROUTES
 * ------------------------------
 */

// Admin lists pending branch test requests
testRouter.get("/admin/requests", verifyAdminToken, listTestRequests);

// Admin approves/rejects a branch test request
testRouter.put("/admin/requests/:id", verifyAdminToken, handleTestRequest);

/**
 * ------------------------------
 * REFERENCE RANGE ROUTES
 * ------------------------------
 */

// List all reference ranges
testRouter.get("/admin/reference-ranges", verifyAdminToken, listReferenceRanges);
testRouter.get("/reference-ranges", verifyBranchToken, listReferenceRanges);

// Get all ranges for a specific test
testRouter.get("/reference-ranges/test/:testId", verifyAdminToken, getReferenceRangesByTestId);
testRouter.get("/branch/reference-ranges/test/:testId", verifyBranchToken, getReferenceRangesByTestId);

// Add multiple ranges for a test
testRouter.post("/reference-ranges/add", verifyAdminToken, addReferenceRanges);

// Update a single range
// in testRouter.js
testRouter.put("/reference-ranges", verifyAdminToken, updateReferenceRange);


// Delete a single range
testRouter.delete("/reference-ranges/:id", verifyAdminToken, deleteReferenceRange);

export default testRouter;
