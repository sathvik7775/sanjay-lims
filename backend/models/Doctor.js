import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    specialization: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },



    regOn: {
      type: Date,
      default: Date.now, // automatically filled when doctor is added
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Doctor", doctorSchema);
