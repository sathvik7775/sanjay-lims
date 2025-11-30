import express from "express";
import {
  addPDF,
  getPDFByReportId,
  listAllPDFs,
  previewPDF,
  deletePDF
} from "../controllers/pdfController.js";

import { publicReportPage } from "../controllers/publicReportController.js";

const pdfRouter = express.Router();

// ➕ Add (Generate + Upload) new PDF
pdfRouter.post("/add", addPDF);

// 🔍 Get PDF by Report ID
pdfRouter.get("/get/:reportId", getPDFByReportId);

// 🟣 LIVE PDF PREVIEW (No upload, No DB save)
pdfRouter.post("/preview", previewPDF);

// 🗑️ DELETE PDF (Cloudinary + DB)
pdfRouter.delete("/delete/:reportId", deletePDF);

// 📜 List all PDFs
pdfRouter.get("/list", listAllPDFs);

// 🌍 PUBLIC REPORT PAGE (LabSmart type)
pdfRouter.get("/public/report/:token", publicReportPage);

export default pdfRouter;
