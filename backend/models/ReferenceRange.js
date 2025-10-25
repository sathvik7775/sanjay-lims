import mongoose from "mongoose";

const referenceRangeSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    testName: {
      type: String,
      required: true, // always store test name for reference
    },
    parameterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parameter",
      default: null, // optional for tests without parameters
    },
    parameterName: {
      type: String,
      default: null, // optional, only for parameter-specific ranges
    },

    // 🔹 Type of section: Numeric or Text
    which: {
      type: String,
      enum: ["Numeric", "Text"],
      default: "Numeric",
    },

    // ✅ For Numeric type
    sex: {
      type: String,
      enum: ["Any", "Male", "Female", "Other"],
      default: "Any",
    },
    minAge: { type: Number, default: 0 },
    minUnit: {
      type: String,
      enum: ["Days", "Months", "Years"],
      default: "Years",
    },
    maxAge: { type: Number, default: 0 },
    maxUnit: {
      type: String,
      enum: ["Days", "Months", "Years"],
      default: "Years",
    },
    lower: { type: Number },
    upper: { type: Number },

    // ✅ For Text type (like urine tests)
    textValue: {
      type: String,
      default: null,
    },

    // Optional: shown value in report (can auto-derive or custom)
    displayText: { type: String },
  },
  { timestamps: true }
);

const ReferenceRange = mongoose.model("ReferenceRange", referenceRangeSchema);
export default ReferenceRange;
