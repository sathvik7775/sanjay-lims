import mongoose from "mongoose";

const testCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    createdBy: {
      type: String, // "admin" or "branch"
      default: "admin",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null, // null for global categories
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Rejected"],
      default: "Active", // Active if added by admin, Pending if branch request approved later
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestCategory", testCategorySchema);

