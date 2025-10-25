import mongoose from "mongoose";

const paramSchema = new mongoose.Schema({
  paramId: { type: mongoose.Schema.Types.ObjectId, ref: "Parameter", required: true },
  name: { type: String, required: true, trim: true },
  unit: { type: String, default: "", trim: true },
  groupBy: { type: String, default: "Ungrouped", trim: true },
  value: { type: String, default: "", trim: true },
  reference: { type: String, default: "", trim: true },
});

const testSchema = new mongoose.Schema({
  testName: { type: String, required: true, trim: true },
  category: { type: String, default: "Other", trim: true },
  interpretation: { type: String, default: "", trim: true },
  params: [paramSchema],
});

const panelOrPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isPanel: { type: Boolean, default: false },
  isPackage: { type: Boolean, default: false },
  interpretation: { type: String, default: "", trim: true },
  tests: [testSchema],
});

const categorySchema = new mongoose.Schema({
  categoryName: { type: String, required: true, trim: true },
  items: [mongoose.Schema.Types.Mixed], // Can contain testSchema or panelOrPackageSchema
});

const resultSchema = new mongoose.Schema(
  {
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Case", required: true },
    reportNo: { type: String, trim: true },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

    // 🔹 Patient details
    patient: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      age: { type: Number, required: true },
      ageUnit: { type: String, default: "Years", trim: true },
      sex: { type: String, required: true, trim: true },
      doctor: { type: String, default: "", trim: true },
      uhid: { type: String, default: "", trim: true },
      regNo: { type: String, default: "", trim: true },
    },

    // 🔹 Full structured categories
    categories: [categorySchema],

    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Result", resultSchema);
