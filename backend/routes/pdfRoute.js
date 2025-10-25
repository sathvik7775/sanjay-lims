import express from "express";
import {
  addPDF,
  getPDFByReportId,
  listAllPDFs
} from "../controllers/pdfController.js";

const pdfRouter = express.Router();

// ➕ Add (Generate + Upload) new PDF
pdfRouter.post("/add", addPDF);

// 🔍 Get PDF by Report ID & Branch ID
pdfRouter.get("/get/:reportId", getPDFByReportId);

// 📜 List all PDFs (optional branch filter)
pdfRouter.get("/list", listAllPDFs);

export default pdfRouter;
