// models/PrintSetting.js
import mongoose from "mongoose";

const PrintSettingSchema = new mongoose.Schema({
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  withLetterhead: { type: Boolean, default: true },

  // 🧾 Letterhead
  letterhead: {
    setAsDefault: { type: Boolean, default: true},
    headerHeight: { type: Number, default: 4.5 },
    caseInfoHeight: { type: Number, default: 3.0 },
    signatureHeight: { type: Number, default: 3.4 },
    footerHeight: { type: Number, default: 3.4 },
  },

  // 🎨 Design
  design: {
    fontFamily: { type: String, default: "Arial" },
    fontSize: { type: Number, default: 12 },
    spacing: { type: Number, default: 1 },
    indentNested: { type: Boolean, default: false },
    boldValues: { type: Boolean, default: false },
    redAbnormal: { type: Boolean, default: false },
    boldAbnormal: { type: Boolean, default: false },
  },

  // ⚙️ General
  general: {
    useHLMarkers: { type: Boolean, default: true },
    categoryNewPage: { type: Boolean, default: false },
    useNABLFormat: { type: Boolean, default: false },
    capitalizeTests: { type: Boolean, default: false },
  },

  // 👁️ Show/Hide
  showHide: {
    
    showPageNumber: { type: Boolean, default: true },
    showQRCode: { type: Boolean, default: true },
    showTATTime: { type: Boolean, default: false },
  },

  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("PrintSetting", PrintSettingSchema);
