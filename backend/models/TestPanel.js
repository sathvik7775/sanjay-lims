import mongoose from "mongoose";

const Schema = mongoose.Schema;

const TestSchema = new Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
    name: { type: String, required: true },
    shortName: { type: String },
    category: { type: String },
    unit: { type: String, default: "" },
    price: { type: Number, default: 0 },
    referenceRange: { type: String, default: "" },
    method: { type: String, default: "" },
    notes: { type: String, default: "" },
    // Add any other test fields you want to store
  },
  { _id: false } // Prevent Mongoose from creating an extra _id for each subdocument
);

const TestPanelSchema = new Schema(
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
    tests: [TestSchema], // Store full test objects

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
    addToRateList: { type: Boolean, default: false },
    createdBy: {
      type: String,
      default: "admin",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestPanel", TestPanelSchema);
