import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import {
  addPanel,
  listGlobalPanels,
  deletePanel,
  handlePanelRequest,
  listPanelRequests,
  editPanel,
  getPanelById,
} from "../controllers/testPanelController.js";

const panelRouter = express.Router();

/**
 * ------------------------------
 * GLOBAL TEST PANEL ROUTES
 * ------------------------------
 */

// Branch adds panel request, Admin adds directly
panelRouter.post("/add", verifyBranchToken, addPanel); // branch sends request
panelRouter.post("/admin/add", verifyAdminToken, addPanel); // admin adds global

// List global panels (for both admin and branch)
panelRouter.get("/list", verifyBranchToken, listGlobalPanels);
panelRouter.get("/admin/list", verifyAdminToken, listGlobalPanels);

// Admin deletes a global panel
panelRouter.delete("/admin/delete/:id", verifyAdminToken, deletePanel);

// Admin edits a global panel
panelRouter.put("/admin/edit/:id", verifyAdminToken, editPanel);

// Admin gets a single panel by ID
panelRouter.get("/admin/panel/:id", verifyAdminToken, getPanelById);
panelRouter.get("/panel/:id", verifyBranchToken, getPanelById);

/**
 * ------------------------------
 * BRANCH TEST PANEL REQUEST ROUTES
 * ------------------------------
 */

// Admin lists pending branch panel requests
panelRouter.get("/admin/requests", verifyAdminToken, listPanelRequests);

// Admin approves/rejects a branch panel request
panelRouter.put("/admin/requests/:id", verifyAdminToken, handlePanelRequest);

export default panelRouter;
