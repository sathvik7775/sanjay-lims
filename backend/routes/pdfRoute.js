import express from "express";
import {
  addPDF,
  getPDFByReportId,
  listAllPDFs,
  previewPDF
} from "../controllers/pdfController.js";

const pdfRouter = express.Router();

// ➕ Add (Generate + Upload) new PDF
pdfRouter.post("/add", addPDF);

// 🔍 Get PDF by Report ID
pdfRouter.get("/get/:reportId", getPDFByReportId);

// 🟣 LIVE PDF PREVIEW (No upload, No DB save)
pdfRouter.post("/preview", previewPDF);

// 📜 List all PDFs
pdfRouter.get("/list", listAllPDFs);

export default pdfRouter;
