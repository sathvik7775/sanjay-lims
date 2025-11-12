import mongoose from "mongoose";

const testPackageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
        ref: "Test", // reference to Test collection
      },
    ],
    panels: [
      {
        type: mongoose.Schema.Types.ObjectId,
       ref: "TestPanel", // reference to Panel collection
      },
    ],
    inRatelist: {
      type: Boolean,
      default: false, // Branch requests default to not in ratelist
    },
    addToRateList: { type: Boolean, default: false },
    createdBy: {
      type: String,
      ref: "admin",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestPackage", testPackageSchema);
