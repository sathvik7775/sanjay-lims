import Formula from "../models/Formula.js";
import Test from "../models/Test.js";

/**
 * 🧮 Create a new formula for a test
 */
export const createFormula = async (req, res) => {
  try {
    const { testId, testName, shortName, formulaString, dependencies, remarks, branchId } = req.body;

    // Validate that the test exists
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: "Test not found" });
    }

    // Create formula
    const newFormula = await Formula.create({
      testId,
      testName: testName || test.name,
      shortName: shortName || test.shortName,
      formulaString,
      dependencies,
      remarks,
      branchId,
    });

    // Update test -> mark as formula type
    await Test.findByIdAndUpdate(testId, { isFormula: true });

    res.status(201).json({
      success: true,
      message: "Formula created successfully",
      data: newFormula,
    });
  } catch (error) {
    console.error("❌ Error creating formula:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**
 * 📄 Get all formulas
 */
export const getAllFormulas = async (req, res) => {
  try {
    const { branchId } = req.query;
    const query = branchId ? { branchId } : {};

    const formulas = await Formula.find(query).populate("testId", "name shortName");
    res.status(200).json({ success: true, data: formulas });
  } catch (error) {
    console.error("❌ Error fetching formulas:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 🔍 Get single formula by testId
 */
export const getFormulaByTestId = async (req, res) => {
  try {
    const { testId } = req.params;
    const formula = await Formula.findOne({ testId }).populate("dependencies.testId", "name shortName");

    if (!formula) {
      return res.status(404).json({ success: false, message: "Formula not found for this test" });
    }

    res.status(200).json({ success: true, data: formula });
  } catch (error) {
    console.error("❌ Error fetching formula:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✏️ Update formula
 */
export const updateFormula = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Formula.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Formula not found" });
    }

    res.status(200).json({ success: true, message: "Formula updated successfully", data: updated });
  } catch (error) {
    console.error("❌ Error updating formula:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 🗑️ Delete formula
 */
export const deleteFormula = async (req, res) => {
  try {
    const { id } = req.params;
    const formula = await Formula.findByIdAndDelete(id);

    if (!formula) {
      return res.status(404).json({ success: false, message: "Formula not found" });
    }

    // Also set isFormula = false in Test model
    await Test.findByIdAndUpdate(formula.testId, { isFormula: false });

    res.status(200).json({ success: true, message: "Formula deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting formula:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
