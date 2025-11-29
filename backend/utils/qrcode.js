import QRCode from "qrcode";

export const generateQRCodeBase64 = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      scale: 4
    });
  } catch (err) {
    console.error("QR generation failed:", err);
    return "";
  }
};
