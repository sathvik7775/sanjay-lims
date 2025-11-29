import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // These two fields will be auto-managed by timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { 
    timestamps: true  // ⬅️ This auto-updates createdAt & updatedAt
  }
);

export default mongoose.model("Admin", AdminSchema);
