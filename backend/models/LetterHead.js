import mongoose from "mongoose";

const letterheadSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subName: {
      type: String,
      trim: true,
    },
    tagline: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contact: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String, // file URL or base64
      default: "",
    },
    footerNotes: {
      type: [String], // like disclaimers, dynamic list
      default: [
        "All results should be co-related clinically",
        "If results are alarming, contact the laboratory immediately",
        "Not valid for medico-legal purposes",
        "The test with an asterisk (*) is not accredited by NABL",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Letterhead", letterheadSchema);
