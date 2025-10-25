import bwipjs from "bwip-js";

export const generateBarcodeBase64 = async (text) => {
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",       // Barcode type
      text: text || "N/A",   // Text to encode (e.g., patient.regNo)
      scale: 3,              // 3 = medium size
      height: 12,            // Height in mm
      includetext: true,     // Show text under barcode
      textxalign: "center",  // Center the text
    });
    return png.toString("base64");
  } catch (err) {
    console.error("❌ Barcode generation failed:", err);
    return "";
  }
};
