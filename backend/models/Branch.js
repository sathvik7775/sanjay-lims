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
    loginPassword: { type: String, required: true  },
  },
  { timestamps: true }
);

// 🔒 Hash password before save
branchSchema.pre("save", async function (next) {
  if (!this.isModified("loginPassword")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.loginPassword = await bcrypt.hash(this.loginPassword, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔍 Compare password method
branchSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.loginPassword);
};

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;
