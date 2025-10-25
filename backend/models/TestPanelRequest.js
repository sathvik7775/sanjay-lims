import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TestPanelRequestSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Panel name is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    tests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Test", // Reference to Test model
      },
    ],
    hideInterpretation: {
      type: Boolean,
      default: true,
    },
    hideMethod: {
      type: Boolean,
      default: true,
    },
    interpretation: {
      type: String,
      default: "",
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true, // Branch submitting the request
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who approves/rejects
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestPanelRequest", TestPanelRequestSchema);
