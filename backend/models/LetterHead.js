import mongoose from "mongoose";

const letterheadSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    name: {
      type: String,
      required: [true, "Lab name is required"],
      trim: true,
    },
    subName: {
      type: String,
      trim: true,
      default: "",
    },
    tagline: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    logo: {
      type: String, // File URL or base64
      default: "",
    },
    footerNotes: {
      type: [String],
      default: [
        "All results should be correlated clinically.",
        "If results are alarming, contact the laboratory immediately.",
        "Not valid for medico-legal purposes.",
        "Tests with an asterisk (*) are not accredited by NABL.",
      ],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Letterhead", letterheadSchema);
