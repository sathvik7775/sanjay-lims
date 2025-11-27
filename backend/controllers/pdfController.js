import cloudinary from "../config/cloudinary.js";
import { generatePDF } from "../pdfGenerator.js";
import { PDF } from "../models/PdfModel.js";


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
export const previewPDF = async (req, res) => {
  try {
    const { reportData, patient, letterhead, signatures = [], printSetting = {} } = req.body;

    // Validate
    if (!reportData || !letterhead) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    // Generate fresh PDF
    const pdfBuffer = await generatePDF(
      reportData,
      patient,
      letterhead,
      signatures,
      printSetting
    );

    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error("generatePDF did not return a buffer");
    }

    // Return PDF buffer without saving
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




// 🟢 2️⃣ UPLOAD PDF TO CLOUDINARY
export const addPDF = async (req, res) => {
  try {
    const { reportId, branchId, patient, reportData, letterhead, signatures = [], printSetting = {} } = req.body;

    if (!reportId || !branchId || !reportData || !letterhead) {
      return res.status(400).json({ success: false, message: "Missing required data" });
    }

    // Generate PDF Buffer
    const pdfBuffer = await generatePDF(reportData, patient, letterhead, signatures, printSetting);
    if (!Buffer.isBuffer(pdfBuffer)) throw new Error("generatePDF did not return a Buffer");

    const fileName = `Report_${reportId}.pdf`;

    // Upload to Cloudinary with auto type (allows inline PDF)
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
  {
    resource_type: "raw",     // <— REQUIRED for PDFs
    folder: "lims_reports",
    public_id: fileName,
    type: "upload",
    flags: "attachment:false" // <— Prevents fl_attachment from generating
  },
  (error, result) => {
    if (error) return reject(error);
    resolve(result);
  }
);


      uploadStream.end(pdfBuffer);
    });

    const uploadResult = await uploadPromise;

    // Use Cloudinary URL as-is (no attachment flag)
    const pdfUrl = uploadResult.secure_url;

    // Save to DB
    const savedPDF = await PDF.findOneAndUpdate(
      { reportId, branchId },
      { pdfUrl },
      { upsert: true, new: true }
    );

    return res.json({
      success: true,
      message: "PDF uploaded successfully",
      pdfUrl: savedPDF.pdfUrl
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
