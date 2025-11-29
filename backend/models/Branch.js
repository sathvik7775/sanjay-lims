import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    contact: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    gst: { type: String, trim: true },
    branchCode: { type: String, trim: true },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    logo: { type: String },

    // Login credentials
    loginEmail: { type: String, required: true },
    loginPassword: { type: String, required: true },
  },
  { timestamps: true }
);

// ❌ REMOVED PASSWORD HASHING FROM SCHEMA
// ❌ NO pre("save") hook here

// 🔍 Compare password method (KEEP THIS)
branchSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.loginPassword);
};

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
