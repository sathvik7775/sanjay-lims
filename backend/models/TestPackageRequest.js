import mongoose from "mongoose";

const testPackageRequestSchema = new mongoose.Schema(
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
    fee: {
      type: Number,
      default: 0,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Both", "Other"],
      default: "Both",
    },
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test",
      },
    ],
    addToRateList: { type: Boolean, default: false },
    panels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TestPanel",
      },
    ],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestPackageRequest", testPackageRequestSchema);
