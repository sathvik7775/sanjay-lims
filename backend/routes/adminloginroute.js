import express from "express";
import {
  adminLogin,
  getAdminProfile,
  updateAdminProfile
} from "../controllers/adminlogincontroller.js";

const adminLoginRouter = express.Router();

// 🔐 Admin Login
adminLoginRouter.post("/login", adminLogin);

// 👤 Get Admin Profile (email only)
adminLoginRouter.get("/profile", getAdminProfile);

// ✏️ Update Admin Profile (email / password)
adminLoginRouter.put("/profile", updateAdminProfile);

export default adminLoginRouter;
