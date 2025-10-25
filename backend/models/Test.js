import mongoose from "mongoose";

// 🧩 Sub-schema for normal/reference ranges
const ReferenceRangeSchema = new mongoose.Schema({
  sex: {
    type: String,
    enum: ["Any", "Male", "Female"],
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
});

// 🧪 Sub-schema for multi/nested parameters
const ParameterSchema = new mongoose.Schema({
  order: { type: Number },
  name: {
    type: String,
    required: function () {
      return this.type === "multi" || this.type === "nested";
    },
  },
  shortName: { type: String },
  unit: { type: String },
  inputType: {
    type: String,
    enum: ["Single Line", "Numeric", "Paragraph"],
    default: "Single Line",
  },
  defaultResult: { type: String },
  isOptional: { type: Boolean, default: false },
  groupBy: { type: String }, // for nested tests
});


// 🧬 Main Test schema
const TestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["single", "multi", "nested", "document"],
      required: true,
    },
    name: { type: String, required: true },
    shortName: { type: String },
    category: { type: String },
    unit: {
      type: String,
      // required: function() {
      //   return this.type === "single";
      // }
    },
    price: { type: Number },
    inputType: {
      type: String,
      enum: ["Single Line", "Numeric", "Paragraph"],
      default: "Single Line",
    },
    method: { type: String },
    instrument: { type: String },
    interpretation: { type: String },
    defaultResult: { type: String }, // for document type
    displayInReport: { type: Boolean, default: true },

    // 🧩 include reference/normal ranges
    referenceRanges: [ReferenceRangeSchema],

    // 🧩 multi/nested parameters
    parameters: [ParameterSchema],

    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

    status: {
      type: String,
      enum: ["Active", "Pending", "Rejected"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Test", TestSchema);
