import mongoose from "mongoose";

const letterheadSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch ID is required"],
    },
    headerImage: {
      type: String, // URL or file path for header image
      required: [true, "Header image is required"],
    },
    headerHeight: {
      type: Number, // Height in pixels or mm (depending on frontend use)
      default: 100,
    },
    footerImage: {
      type: String, // URL or file path for footer image
      required: [true, "Footer image is required"],
    },
    footerHeight: {
      type: Number, // Height in pixels or mm
      default: 100,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Letterhead", letterheadSchema);
