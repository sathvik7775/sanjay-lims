import express from "express";
import { addTemplate, deleteTemplate, getTemplates, updateTemplate } from "../controllers/whatsappTemplateController.js";
import { verifyAdminToken } from "../middlewares/adminAuth.js";



const whatsappRouter = express.Router();

// 🔹 WhatsApp Template Routes
whatsappRouter.post("/add", verifyAdminToken, addTemplate);
whatsappRouter.get("/get",  getTemplates);
whatsappRouter.put("/:id", verifyAdminToken, updateTemplate);
whatsappRouter.delete("/:id", verifyAdminToken, deleteTemplate);

export default whatsappRouter;
