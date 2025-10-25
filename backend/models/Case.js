import mongoose from "mongoose";
import Counter from "./Counter.js"; // 👈 create this model (shown below)

const { Schema, model } = mongoose;

// ✅ Payment Schema
const PaymentSchema = new Schema({
  total: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  received: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  mode: { type: String, enum: ["cash", "card", "upi"], default: "cash" },
  remarks: { type: String },
});

// ✅ Patient Schema
const PatientSchema = new Schema({
  mobile: { type: String, required: true },
  title: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String },
  age: { type: Number },
  sex: { type: String, enum: ["Male", "Female", "Other"] },
  uhid: { type: String },
  doctor: { type: String },
  agent: { type: String },
  center: { type: String, default: "Main" },
  onlineReport: { type: Boolean, default: false },
  email: { type: String },
  address: { type: String },
  aadhaar: { type: String },
  history: { type: String },
});

// ✅ Main Case Schema
const CaseSchema = new Schema({
  regNo: { type: String, unique: true }, // Auto-generated registration number
  dcn: { type: String, unique: true }, // ✅ New field for Document Control Number
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },

  patient: { type: PatientSchema, required: true },
  tests: {
    type: Map, // key = category name, value = array of test/panel IDs
    of: [String], // store only IDs
    default: {},
  },
  categories: { type: [String], default: [] },
  payment: { type: PaymentSchema, required: true },
  status: {
    type: String,
    enum: ["due", "no due", "cancelled", "refund"],
    default: "due",
  },
  createdAt: { type: Date, default: Date.now },
});

// ✅ Pre-save hook to generate regNo & DCN
CaseSchema.pre("save", async function (next) {
  const Case = mongoose.model("Case", CaseSchema);

  // 🔹 Generate REG NO (if missing)
  if (!this.regNo) {
    let regNo;
    let exists = true;

    // Keep generating until unique (per branch)
    while (exists) {
      // Generate a random 9-digit number between 700000000 and 799999999
      const randomNum = Math.floor(700000000 + Math.random() * 100000000);
      regNo = randomNum.toString();

      // Ensure uniqueness within the same branch
      exists = await Case.exists({ branchId: this.branchId, regNo });
    }

    this.regNo = regNo;
  }

  // 🔹 Generate DCN (if missing)
  if (!this.dcn) {
    const counter = await Counter.findOneAndUpdate(
      { name: "dcn" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const entryNum = counter.seq;
    const labNum = entryNum + 5; // optional offset
    this.dcn = `E${entryNum}, L${labNum}`;
  }

  next();
});


export default model("Case", CaseSchema);
