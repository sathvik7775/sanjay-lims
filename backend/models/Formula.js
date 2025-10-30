// models/Formula.js
import mongoose from "mongoose";

const FormulaSchema = new mongoose.Schema(
  {
    // 🧩 The test whose result is calculated by this formula
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    // 🔤 For easy access without populate (optional)
    testName: { type: String, required: true },
    shortName: { type: String },

    // 🧠 Actual formula expression
    // Example: "(GLUCOSE + CHOLESTEROL) / 2"
    formulaString: {
      type: String,
      required: true,
    },

    // 🔗 Tests that this formula depends on
    // e.g. if HDL = f(TC, LDL, TG) → dependencies = [TC_id, LDL_id, TG_id]
    dependencies: [
      {
        testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test" },
        testName: { type: String },
        shortName: { type: String },
      },
    ],

    // 🧮 Optional: safe precompiled JS expression for runtime evaluation
    expression: { type: String },

    // 📋 Notes or explanation for user
    remarks: { type: String },

    // 🏥 Branch or Lab association (if multi-branch system)
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },

    // ⚙️ Active/Inactive control
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Formula", FormulaSchema);
