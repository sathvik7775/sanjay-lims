import express from "express";
import {
  addSignature,
  deleteSignature,
  getAllSignatures,
  getSignaturesByBranch,
} from "../controllers/signatureController.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { upload } from "../middlewares/upload.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";

const signatureRouter = express.Router();

// 🧾 Admin Routes
signatureRouter.post("/admin/add", verifyAdminToken, upload.single("image"), addSignature);
signatureRouter.get("/admin/list", verifyAdminToken, getAllSignatures);
signatureRouter.delete("/admin/delete/:id", verifyAdminToken, deleteSignature);

// 🧾 Branch Routes
signatureRouter.get("/branch/:branchId",  getSignaturesByBranch);

export default signatureRouter;
