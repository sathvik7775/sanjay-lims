import cloudinary from "../config/cloudinary.js";
import Signature from "../models/Signature.js";

import fs from "fs";

/**
 * @desc Add a new signature (Admin)
 * @route POST /api/signature/admin/add
 * @access Admin
 */
export const addSignature = async (req, res) => {
  try {
    const { branchId, name, designation } = req.body;
    const file = req.file; // Multer file

    if (!file) {
      return res.status(400).json({ success: false, message: "Image file is required." });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: "lab_signatures",
    });

    // Delete local file after upload
    fs.unlinkSync(file.path);

    const newSignature = await Signature.create({
      branchId,
      name,
      designation,
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
    });

    res.status(201).json({
      success: true,
      message: "Signature added successfully.",
      signature: newSignature,
    });
  } catch (err) {
    console.error("Error adding signature:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Get all signatures (Admin)
 * @route GET /api/signature/admin/list
 * @access Admin
 */
export const getAllSignatures = async (req, res) => {
  try {
    const signatures = await Signature.find().populate("branchId", "name code location");
    res.status(200).json({ success: true, signatures });
  } catch (err) {
    console.error("Error fetching signatures:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Get signatures by branchId
 * @route GET /api/signature/branch/:branchId
 * @access Branch / Admin
 */
export const getSignaturesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const signatures = await Signature.find({ branchId });

    if (!signatures || signatures.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No signatures found for this branch.",
      });
    }

    res.status(200).json({ success: true, data: signatures });
  } catch (err) {
    console.error("Error fetching signatures:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Delete signature (Admin)
 * @route DELETE /api/signature/admin/delete/:id
 * @access Admin
 */
export const deleteSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const signature = await Signature.findById(id);

    if (!signature) {
      return res.status(404).json({ success: false, message: "Signature not found." });
    }

    // Delete image from Cloudinary
    if (signature.imagePublicId) {
      await cloudinary.uploader.destroy(signature.imagePublicId);
    }

    await signature.deleteOne();

    res.status(200).json({ success: true, message: "Signature deleted successfully." });
  } catch (err) {
    console.error("Error deleting signature:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
