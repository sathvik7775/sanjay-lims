import express from "express";
import { verifyBranchToken } from "../middlewares/branchAuth.js";
import { getBranchById } from "../controllers/branchDataController.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";




const branchDataRoute = express.Router();

branchDataRoute.get("/:id", verifyAdminToken, getBranchById)


export default branchDataRoute;
