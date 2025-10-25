import PrintSetting from "../models/PrintSetting.js";

/**
 * @desc Add new print settings for a branch
 * @route POST /api/print-settings/:branchId
 * @access Admin
 */
export const addPrintSettings = async (req, res) => {
  const { branchId } = req.params;
  const data = req.body;

  try {
    // Check if settings already exist
    const existing = await PrintSetting.findOne({ branchId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Print settings already exist for this branch",
      });
    }

    const newSettings = new PrintSetting({
      branchId,
      letterhead: data.letterhead || {},
      design: data.design || {},
      general: data.general || {},
      showHide: data.showHide || {},
      updatedAt: Date.now(),
    });

    await newSettings.save();

    return res.status(201).json({
      success: true,
      message: "Print settings added successfully",
      data: newSettings,
    });
  } catch (error) {
    console.error("❌ Error adding print settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add print settings",
    });
  }
};

/**
 * @desc Get custom print settings by branch ID
 * @route GET /api/print-settings/:branchId
 * @access Admin
 */
export const getPrintSettingsByBranch = async (req, res) => {
  const { branchId } = req.params;

  try {
    let settings = await PrintSetting.findOne({ branchId });

    // If not found, create default settings
    if (!settings) {
      settings = new PrintSetting({
        branchId,
        letterhead: {},
        design: {},
        general: {},
        showHide: {},
        updatedAt: Date.now(),
      });
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("❌ Error fetching print settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch print settings",
    });
  }
};

/**
 * @desc Update existing print settings for a branch
 * @route PUT /api/print-settings/:branchId
 * @access Admin
 */
export const updatePrintSettings = async (req, res) => {
  const { branchId } = req.params;
  const updateData = req.body;

  try {
    const updated = await PrintSetting.findOneAndUpdate(
      { branchId },
      { ...updateData, updatedAt: Date.now() },
      { new: true, upsert: true } // upsert ensures creation if not exists
    );

    return res.status(200).json({
      success: true,
      message: "Print settings updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("❌ Error updating print settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update print settings",
    });
  }
};
