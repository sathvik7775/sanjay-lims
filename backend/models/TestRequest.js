import mongoose from "mongoose";

const ParameterSchema = new mongoose.Schema({
  order: { type: Number },
  name: {
    type: String,
    required: function () {
      // `this` refers to the parameter object, parent is the test type
      return this.parent().type === "multi" || this.parent().type === "nested";
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

const TestRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["single", "multi", "nested", "document"],
      required: true,
    },
    name: {
      type: String,
      required: function () {
        return this.type === "multi" || this.type === "nested";
      },
      trim: true,
    },
    shortName: { type: String },
    category: { type: String },
    price: { type: Number, default: 0 },
    method: { type: String, default: "" },
    instrument: { type: String, default: "" },
    interpretation: { type: String, default: "" },
    parameters: { type: [ParameterSchema], default: [] },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("TestRequest", TestRequestSchema);

