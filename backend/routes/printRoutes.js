import express from "express";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { addPrintSettings, getPrintSettingsByBranch, updatePrintSettings } from "../controllers/printcontroller.js";


const printRouter = express.Router();

// Admin routes
printRouter.post("/:branchId",  addPrintSettings);
printRouter.get("/:branchId",  getPrintSettingsByBranch);
printRouter.put("/:branchId",  updatePrintSettings);

export default printRouter;
