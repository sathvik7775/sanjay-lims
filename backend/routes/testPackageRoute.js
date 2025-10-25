import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { addPackage, deletePackage, editPackage, getPackageById, handlePackageRequest, listGlobalPackages, listPackageRequests, toggleRatelist } from "../controllers/testPackageContoller.js";


const packageRouter = express.Router();

/**
 * ------------------------------
 * GLOBAL TEST PACKAGE ROUTES
 * ------------------------------
 */

// Branch adds package request, Admin adds directly
packageRouter.post("/add", verifyBranchToken, addPackage); // branch sends request
packageRouter.post("/admin/add", verifyAdminToken, addPackage); // admin adds global

// List global packages (for both admin and branch)
packageRouter.get("/list", verifyBranchToken, listGlobalPackages);
packageRouter.get("/admin/list", verifyAdminToken, listGlobalPackages);

// Admin deletes a global package
packageRouter.delete("/admin/delete/:id", verifyAdminToken, deletePackage);

// Admin edits a global package
packageRouter.put("/admin/edit/:id", verifyAdminToken, editPackage);

// Admin gets a single package by ID
packageRouter.get("/admin/package/:id", verifyAdminToken, getPackageById);
packageRouter.get("/branch/package/:id", verifyBranchToken, getPackageById);

// Admin toggle ratelist
packageRouter.put("/admin/toggle-ratelist/:id", verifyAdminToken, toggleRatelist);

/**
 * ------------------------------
 * BRANCH TEST PACKAGE REQUEST ROUTES
 * ------------------------------
 */

// Admin lists pending branch package requests
packageRouter.get("/admin/requests", verifyAdminToken, listPackageRequests);

// Admin approves/rejects a branch package request
packageRouter.put("/admin/requests/:id", verifyAdminToken, handlePackageRequest);

export default packageRouter;
