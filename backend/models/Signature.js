import mongoose from "mongoose";

const signatureSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    designation: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String, // Cloudinary URL
      required: true,
    },
    imagePublicId: {
      type: String, // For easy deletion later
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Signature", signatureSchema);
