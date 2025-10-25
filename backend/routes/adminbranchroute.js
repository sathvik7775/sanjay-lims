import express from "express";
import multer from "multer";

import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { addBranch, deleteBranch, editBranch, getAllBranches, toggleBranchStatus, getBranchById } from "../controllers/adminBranchcontroller.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";

// Configure file upload for logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({ storage });

const adminBranchRouter = express.Router();



// ✅ Admin Branch Routes
adminBranchRouter.post("/add", verifyAdminToken, upload.single("logo"), addBranch);
adminBranchRouter.get("/list", verifyAdminToken, getAllBranches);
adminBranchRouter.get("/branch/list", verifyBranchToken, getAllBranches);
adminBranchRouter.get("/:id", verifyAdminToken, getBranchById);
adminBranchRouter.put("/edit/:id", verifyAdminToken, upload.single("logo"), editBranch);
adminBranchRouter.delete("/delete/:id", verifyAdminToken, deleteBranch);
adminBranchRouter.put("/toggle/:id", verifyAdminToken, toggleBranchStatus);

export default adminBranchRouter;
