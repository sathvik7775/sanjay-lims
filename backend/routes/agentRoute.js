import express from "express";
import {
  addAgent,
  deleteAgent,
  updateAgentStatus,
  getAllAgents,
  getAgentById,
} from "../controllers/agentController.js";

import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";

const agentRouter = express.Router();

// ======================
// 🧾 Admin Routes
// ======================

// Get all agents (Admin)
agentRouter.get("/admin/list", verifyAdminToken, getAllAgents);

// Add new agent
agentRouter.post("/add", verifyAdminToken, addAgent);

// Delete an agent
agentRouter.delete("/delete/:id", verifyAdminToken, deleteAgent);

// Archive or activate agent
agentRouter.patch("/status/:id", verifyAdminToken, updateAgentStatus);

// ======================
// 🏥 Branch Routes
// ======================

// Get all agents for branch
agentRouter.get("/branch/list", verifyBranchToken, getAllAgents);

// Get a single agent by ID (branch can view)
agentRouter.get("/:id", verifyBranchToken, getAgentById);

export default agentRouter;
