import express from "express";
import {
  addDoctor,
  deleteDoctor,
  getAllDoctors,
  getDoctorById,
} from "../controllers/doctorController.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";
import { verifyBranchToken } from "../middlewares/branchAuth.js";

const doctorRouter = express.Router();

// 🧾 Admin routes
doctorRouter.get("/admin/list", verifyAdminToken, getAllDoctors);
doctorRouter.post("/add", verifyAdminToken, addDoctor);
doctorRouter.delete("/delete/:id", verifyAdminToken, deleteDoctor);

// 🏥 Branch routes
doctorRouter.get("/branch/list", verifyBranchToken, getAllDoctors);
doctorRouter.get("/:id", verifyBranchToken, getDoctorById);

export default doctorRouter;
