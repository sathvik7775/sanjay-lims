import Result from "../models/Result.js";
import Case from "../models/Case.js"; // or Report model depending on your project
import mongoose from "mongoose";

/**
 * @desc Add new result entry with full report structure
 * @route POST /api/results/add
 * @access Branch (Protected)
 */
export const addResult = async (req, res) => {
  try {
    const { reportId, categories, patient, status } = req.body;
    const branchId = req.user?.branchId || null;

    if (!reportId || !Array.isArray(categories) || !patient) {
      return res.status(400).json({ success: false, message: "Invalid data" });
    }

    // 🔹 Get report number from Case/Report
    const reportDoc = await Case.findById(reportId);
    if (!reportDoc) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    const reportNo = reportDoc.regNo || reportDoc.reportNo || "";

    const newResult = new Result({
      reportId,
      reportNo,
      branchId,
      patient,
      categories, // full nested structure: categories → tests/panels → params
      enteredBy: req.user?._id || null,
      status: status,
    });

    await newResult.save();

    return res.status(201).json({
      success: true,
      message: "Results added successfully",
      data: newResult,
    });
  } catch (error) {
    console.error("Error adding result:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get results by reportId
 * @route GET /api/results/report/:reportId
 * @access Branch/Admin
 */
export const getResultsByReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const result = await Result.findOne({ reportId });

    if (!result)
      return res.status(404).json({ success: false, message: "Result not found" });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching result:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Update existing results including full categories & patient
 * @route PUT /api/results/update/:reportId
 * @access Branch/Admin
 */
export const updateResult = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { categories, patient, status } = req.body;

    if (!reportId)
      return res.status(400).json({ success: false, message: "Missing reportId" });

    const cleanCategories = (categories || []).map((cat, i) => ({
      categoryName: cat.categoryName || cat.category || `Category-${i + 1}`,
      items: Array.isArray(cat.items) ? cat.items : [],
    }));

    const updated = await Result.findOneAndUpdate(
      { reportId },
      { categories: cleanCategories, patient, status: status || "In Progress" },
      { new: true, runValidators: true }
    );

    if (!updated)
      return res.status(404).json({ success: false, message: "Result not found" });

    res.status(200).json({
      success: true,
      message: "Results updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating result:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




/**
 * @desc Delete result by reportId
 * @route DELETE /api/results/delete/:reportId
 * @access Admin
 */


export const deleteResult = async (req, res) => {
  try {
    const { reportId } = req.params;

    console.log("🗑 Deleting Result for reportId:", reportId);

    // Ensure valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reportId format",
      });
    }

    // Convert to ObjectId the correct way
    const deleted = await Result.findOneAndDelete({
      reportId: new mongoose.Types.ObjectId(reportId),
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting result:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
/**
 * @desc Get all results
 * @route GET /api/results/all
 * @access Admin
 */
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("reportId", "regNo patient")
      .populate("enteredBy", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
