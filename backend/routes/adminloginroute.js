import express from "express";
import { adminLogin } from "../controllers/adminlogincontroller.js";


const adminLoginRouter = express.Router();


adminLoginRouter.post("/login", adminLogin);

export default adminLoginRouter;
