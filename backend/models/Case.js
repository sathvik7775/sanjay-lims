import mongoose from "mongoose";
import Counter from "./Counter.js"; // 👈 create this model (shown below)

const { Schema, model } = mongoose;

const WhatsappTriggerSchema = new Schema({
  triggerType: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: "WhatsappTemplate" },
});



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
  reportStatus: {
    type: String,
    enum: ["In Progress", "Signed Off", "New"],
    default: "New",
    
  },

  whatsappTriggers: { type: [WhatsappTriggerSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false } // ❗ Disable Mongoose's automatic timestamps
);

// ✅ Pre-save hook to generate regNo & DCN
CaseSchema.pre("save", async function (next) {
  const Case = mongoose.model("Case", CaseSchema);

  // ------- REG NO (same as before) -------
  if (!this.regNo) {
    let regNo;
    let exists = true;

    while (exists) {
      const randomNum = Math.floor(700000000 + Math.random() * 100000000);
      regNo = randomNum.toString();
      exists = await Case.exists({ branchId: this.branchId, regNo });
    }

    this.regNo = regNo;
  }

  // ------- DCN (NEW CATEGORY BASED LOGIC) -------
  if (!this.dcn) {
    const categories = this.categories || [];

    const prefixMap = {
  LAB: "L",
  TMT: "T",
  ECG: "E",      
  ECHO: "EH",    
  USG: "U",
  XRAY: "X",
  OUTSOURCE: "O",
  OTHERS: "OT",
};



    const generatedDCNs = [];

    for (let category of categories) {
      const prefix = prefixMap[category];
      if (!prefix) continue;

      const counter = await Counter.findOneAndUpdate(
        { name: `dcn_${category}` },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      const seq = String(counter.seq).padStart(2, "0");
      const dcnCode = `${prefix}${seq}`;

      generatedDCNs.push(dcnCode);
    }

    this.dcn = generatedDCNs.join(", ");  // Example: "L65, U01"
  }

  next();
});



export default model("Case", CaseSchema);
