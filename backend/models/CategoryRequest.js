import mongoose from "mongoose";

const categoryRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    createdBy: {
      type: String,
      default: "branch", // optional, just to track source
    },
  },
  { timestamps: true }
);

const CategoryRequest = mongoose.model("CategoryRequest", categoryRequestSchema);

export default CategoryRequest;
