import cloudinary from "../config/cloudinary.js";
import { generatePDF } from "../pdfGenerator.js";
import { PDF } from "../models/PdfModel.js";
import Report from "../models/Report.js";       // ⬅ public model
import crypto from "crypto";

// 🔵 1️⃣ GET PDF by Report ID
export const getPDFByReportId = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({ success: false, message: "Missing reportId" });
    }

    const pdfDoc = await PDF.findOne({ reportId });

    if (!pdfDoc) {
      return res.status(404).json({ success: false, message: "PDF not found" });
    }

    return res.json({ success: true, pdfUrl: pdfDoc.pdfUrl, data: pdfDoc });
  } catch (err) {
    console.error("❌ getPDFByReportId failed:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// 🟣 4️⃣ LIVE PDF PREVIEW (no Cloudinary, no DB save)
// 🟣 4️⃣ LIVE PDF PREVIEW (with QR)
export const previewPDF = async (req, res) => {
  try {
    const { reportId, branchId, reportData, patient, letterhead, signatures = [], printSetting = {} } = req.body;

    if (!reportData || !letterhead) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    let qrUrl = null;

    // 🔍 1️⃣ Fetch existing publicToken if available
    if (reportId && branchId) {
      const existing = await PDF.findOne({ reportId, branchId });

      if (existing) {
        const publicRecord = await Report.findOne({ reportId });

        if (publicRecord?.publicToken) {
          qrUrl = `https://slh.org.in/public/report/${publicRecord.publicToken}`;
        }
      }
    }

    // 🟦 If no publicToken found → still generate PDF without QR
    // (or create a temp token if you want)
    // qrUrl will be null
    // generatePDF() should handle null safely

    // 2️⃣ Generate PDF with SAME QR as addPDF
    const pdfBuffer = await generatePDF(
      reportData,
      patient,
      letterhead,
      signatures,
      printSetting,
      qrUrl   // <--- FINAL FIX
    );

    if (!Buffer.isBuffer(pdfBuffer)) throw new Error("generatePDF returned non-buffer");

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (err) {
    console.error("❌ previewPDF failed:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};




export const addPDF = async (req, res) => {
  try {
    const { 
      reportId, 
      branchId, 
      patient, 
      reportData, 
      letterhead, 
      signatures = [], 
      printSetting = {},
      lab
    } = req.body;

    if (!reportId || !branchId || !reportData || !letterhead) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    // 1️⃣ Create Public Token
    const publicToken = crypto.randomBytes(8).toString("hex");
    const publicPdfUrl = `https://slh.org.in/public/report/${publicToken}`;

    // 2️⃣ Generate PDF Buffer WITH QR URL
    const pdfBuffer = await generatePDF(
      reportData,
      patient,
      letterhead,
      signatures,
      printSetting,
      publicPdfUrl       // <--- QR code link passed here
    );

    if (!Buffer.isBuffer(pdfBuffer)) 
      throw new Error("generatePDF did not return a buffer");

    const fileName = `Report_${reportId}.pdf`;

    // 3️⃣ Upload PDF to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "lims_reports",
          public_id: fileName,
          type: "upload",
          flags: "attachment:false"
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(pdfBuffer);
    });

    const pdfUrl = uploadResult.secure_url;

    // 4️⃣ Save to internal PDF table
    const savedPDF = await PDF.findOneAndUpdate(
      { reportId, branchId },
      { pdfUrl },
      { upsert: true, new: true }
    );

    // 5️⃣ Save public report info (Report.js)
    await Report.findOneAndUpdate(
      { publicToken },   // each token unique
      {
        publicToken,
        publicPdfUrl,
        publicActive: true,

        patient: {
          name: `${patient.firstName} ${patient.lastName}`,
          age: `${patient.age} ${patient.ageUnit}`,
          gender: patient.sex
        },

        reportDate: new Date(reportData.createdAt).toLocaleDateString("en-GB"),
        reportTime: new Date(reportData.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        }),

        lab: {
          name: lab?.name || "",
          address: lab?.address || ""
        }
      },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "PDF uploaded successfully",
      pdfUrl: savedPDF.pdfUrl,
      publicPdfUrl,
      publicToken
    });

  } catch (err) {
    console.error("❌ addPDF failed:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// 🧾 3️⃣ LIST ALL PDFs
export const listAllPDFs = async (req, res) => {
  try {
    const { branchId } = req.params;
    const filter = branchId ? { branchId } : {};

    const pdfs = await PDF.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: pdfs.length,
      data: pdfs
    });
  } catch (err) {
    console.error("❌ listAllPDFs failed:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 🗑️ DELETE PDF (Cloudinary + DB)
export const deletePDF = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Missing reportId"
      });
    }

    // 1️⃣ Find PDF record
    const pdfDoc = await PDF.findOne({ reportId });

    if (!pdfDoc) {
      return res.json({
        success: true,
        message: "No PDF found — nothing to delete"
      });
    }

    const pdfUrl = pdfDoc.pdfUrl;

    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/.../lims_reports/Report_123.pdf
    const parts = pdfUrl.split("/");
    const publicIdWithExt = parts[parts.length - 1];     // Report_123.pdf
    const publicId = "lims_reports/" + publicIdWithExt.replace(".pdf", "");

    // 2️⃣ Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw"
      });
      console.log("🗑️ Cloudinary PDF deleted:", publicId);
    } catch (err) {
      console.log("⚠️ Cloudinary delete failed (continuing):", err.message);
    }

    // 3️⃣ Delete DB entry
    await PDF.deleteOne({ reportId });
    console.log("🗑️ PDF table entry deleted");

    // 4️⃣ Delete from Public Report DB
    await Report.deleteOne({ publicToken: pdfDoc.publicToken });
    console.log("🗑️ Public report data deleted");

    return res.json({
      success: true,
      message: "PDF deleted successfully"
    });

  } catch (err) {
    console.error("❌ deletePDF failed:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};























// import { Dropbox } from "dropbox";
// import fetch from "node-fetch";
// import { generatePDF } from "../pdfGenerator.js";
// import { PDF } from "../models/PdfModel.js";


// // 🔵 1️⃣ GET PDF by Report ID
// export const getPDFByReportId = async (req, res) => {
//   try {
//     const { reportId } = req.params;

//     if (!reportId) {
//       return res.status(400).json({ success: false, message: "Missing reportId or branchId" });
//     }

//     const pdfDoc = await PDF.findOne({ reportId});

//     if (!pdfDoc) {
//       return res.status(404).json({ success: false, message: "PDF not found" });
//     }

//     return res.json({ success: true, pdfUrl: pdfDoc.pdfUrl, data: pdfDoc });
//   } catch (err) {
//     console.error("❌ getPDFByReportId failed:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };



// // 🟢 2️⃣ ADD (Generate + Upload) PDF
// export const addPDF = async (req, res) => {
//   try {
//     const { reportId, branchId, patient, reportData, letterhead, signatures = [], printSetting = {} } = req.body;

//     if (!reportId || !branchId || !reportData || !letterhead) {
//       return res.status(400).json({ success: false, message: "Missing required data" });
//     }

//     // 🔹 Generate PDF Buffer
//     const pdfBuffer = await generatePDF(reportData, patient, letterhead, signatures, printSetting);
//     if (!Buffer.isBuffer(pdfBuffer)) throw new Error("generatePDF did not return a Buffer");

//     // 🔹 Dropbox upload
//     const dbx = new Dropbox({
//       clientId: process.env.DROPBOX_APP_KEY,
//       clientSecret: process.env.DROPBOX_APP_SECRET,
//       refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
//       fetch
//     });

//     const fileName = `Report_${reportId}.pdf`;
//     const dropboxResponse = await dbx.filesUpload({
//       path: `/${fileName}`,
//       contents: pdfBuffer,
//       mode: "overwrite"
//     });

//     // 🔹 Create or reuse public link
//     let sharedLinkResp;
//     try {
//       sharedLinkResp = await dbx.sharingCreateSharedLinkWithSettings({
//         path: dropboxResponse.result.path_lower,
//         settings: { requested_visibility: "public" }
//       });
//     } catch (err) {
//       if (err.status === 409) {
//         const existingLinks = await dbx.sharingListSharedLinks({
//           path: dropboxResponse.result.path_lower,
//           direct_only: true
//         });
//         if (existingLinks.result.links.length > 0) {
//           sharedLinkResp = { result: existingLinks.result.links[0] };
//         } else throw err;
//       } else throw err;
//     }

//     const pdfUrl = sharedLinkResp.result.url.replace("?dl=0", "?dl=1");

//     // 🔹 Save in MongoDB
//     const newPDF = await PDF.findOneAndUpdate(
//       { reportId, branchId },
//       { pdfUrl, dropboxPath: dropboxResponse.result.path_display },
//       { upsert: true, new: true }
//     );

//     return res.json({ success: true, message: "PDF added successfully", pdfUrl: newPDF.pdfUrl });
//   } catch (err) {
//     console.error("❌ addPDF failed:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };



// // 🧾 3️⃣ LIST ALL PDFs
// export const listAllPDFs = async (req, res) => {
//   try {
//     const { branchId } = req.params;
//     const filter = branchId ? { branchId } : {};

//     const pdfs = await PDF.find(filter).sort({ createdAt: -1 });

//     return res.json({
//       success: true,
//       count: pdfs.length,
//       data: pdfs
//     });
//   } catch (err) {
//     console.error("❌ listAllPDFs failed:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };
