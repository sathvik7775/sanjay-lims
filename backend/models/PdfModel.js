import mongoose from "mongoose";

const pdfSchema = new mongoose.Schema(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId, // or String if you use custom IDs
      required: true,
      ref: "Report",
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId, // or String
      required: true,
      ref: "Branch",
      index: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    dropboxPath: {
      type: String, // optional, store Dropbox internal path
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // auto add createdAt and updatedAt
);

// Optional: unique index to prevent duplicate PDF for same report & branch
pdfSchema.index({ reportId: 1, branchId: 1 }, { unique: true });

export const PDF = mongoose.model("PDF", pdfSchema);
