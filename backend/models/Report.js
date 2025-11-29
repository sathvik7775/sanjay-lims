// models/Report.js

import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  
  // ─────────────────────────────
  // PUBLIC SHARE FIELDS
  // ─────────────────────────────
  publicToken: { type: String },               // ex: "a9x83ksl2q"
  publicPdfUrl: { type: String },              // Cloudinary / your server PDF URL
  publicActive: { type: Boolean, default: true },

  // ─────────────────────────────
  // PATIENT INFO
  // ─────────────────────────────
  patient: {
    name: String,
    age: String,
    gender: String,
  },

  // ─────────────────────────────
  // REPORT DATE/TIME
  // ─────────────────────────────
  reportDate: String,      // ex: "28-11-2025"
  reportTime: String,      // ex: "04:15 PM"

  // ─────────────────────────────
  // LAB DETAILS
  // ─────────────────────────────
  lab: {
    name: String,
    address: String,
  }

}, { timestamps: true });

export default mongoose.model("Report", reportSchema);
