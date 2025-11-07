import LetterHead from "../models/LetterHead.js";
import cloudinary from "../config/cloudinary.js";

/**
 * @desc Add new letterhead
 * @route POST /api/letterhead/admin/add
 * @access Admin
 */
export const addLetterhead = async (req, res) => {
  try {
    // ✅ Check req.body existence safely
    if (!req.body) {
      return res.status(400).json({ success: false, message: "Request body missing." });
    }

    const { branchId, headerHeight, footerHeight } = req.body;

    if (!branchId) {
      return res.status(400).json({ success: false, message: "Branch ID is required." });
    }

    // ✅ Check file upload presence
    if (!req.files?.headerImage?.[0] || !req.files?.footerImage?.[0]) {
      return res.status(400).json({
        success: false,
        message: "Header and Footer images are required.",
      });
    }

    // ✅ Upload to Cloudinary
    const headerUpload = await cloudinary.uploader.upload(req.files.headerImage[0].path, {
      folder: "letterheads",
    });
    const footerUpload = await cloudinary.uploader.upload(req.files.footerImage[0].path, {
      folder: "letterheads",
    });

    // ✅ Save to MongoDB
    const newLetterhead = new LetterHead({
      branchId,
      headerImage: headerUpload.secure_url,
      headerHeight,
      footerImage: footerUpload.secure_url,
      footerHeight,
    });

    await newLetterhead.save();

    return res.status(201).json({
      success: true,
      message: "Letterhead created successfully.",
      data: newLetterhead,
    });
  } catch (err) {
    console.error("❌ Error creating letterhead:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};


/**
 * @desc Get all letterheads
 * @route GET /api/letterhead/admin/list
 * @access Admin
 */
export const getAllLetterheads = async (req, res) => {
  try {
    const letterheads = await LetterHead.find().populate(
      "branchId",
      "name code location"
    );
    res.status(200).json({ success: true, letterheads });
  } catch (err) {
    console.error("❌ Error fetching letterheads:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Get letterhead by branch
 * @route GET /api/letterhead/branch/:branchId
 * @access Admin / Branch
 */
export const getLetterheadByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const letterhead = await LetterHead.findOne({ branchId }).populate(
      "branchId",
      "name code location"
    );

    if (!letterhead) {
      return res
        .status(404)
        .json({ success: false, message: "Letterhead not found for this branch." });
    }

    res.status(200).json({ success: true, data: letterhead });
  } catch (err) {
    console.error("❌ Error fetching letterhead:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Delete letterhead
 * @route DELETE /api/letterhead/admin/delete/:id
 * @access Admin
 */
export const deleteLetterhead = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LetterHead.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Letterhead not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Letterhead deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting letterhead:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
