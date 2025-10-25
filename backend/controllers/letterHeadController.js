import Letterhead from "../models/Letterhead.js";


/**
 * @desc Add new letterhead
 * @route POST /api/letterheads
 * @access Admin
 */
export const addLetterhead = async (req, res) => {
  try {
    const { branchId, name, subName, tagline, address, contact, email, website, logo, footerNotes } = req.body;

    // Check if already exists for branch
    const existing = await Letterhead.findOne({ branchId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Letterhead already exists for this branch.",
      });
    }

    const letterhead = new Letterhead({
      branchId,
      name,
      subName,
      tagline,
      address,
      contact,
      email,
      website,
      logo,
      footerNotes,
    });

    await letterhead.save();
    return res.status(201).json({
      success: true,
      message: "Letterhead created successfully.",
      letterhead,
    });
  } catch (err) {
    console.error("Error creating letterhead:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Get all letterheads
 * @route GET /api/letterheads
 * @access Admin
 */
export const getAllLetterheads = async (req, res) => {
  try {
    const letterheads = await Letterhead.find().populate("branchId", "name code location");
    res.status(200).json({ success: true, letterheads });
  } catch (err) {
    console.error("Error fetching letterheads:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/**
 * @desc Get letterhead by branch ID
 * @route GET /api/letterheads/:branchId
 * @access Admin / Branch
 */
export const getLetterheadByBranch = async (req, res) => {
  try {
    const { branchId } = req.params; // <-- use params instead of body
    const letterhead = await Letterhead.findOne({ branchId }).populate(
      "branchId",
      "name code location"
    );

    if (!letterhead) {
      return res.status(404).json({
        success: false,
        message: "Letterhead not found for this branch.",
      });
    }

    res.status(200).json({ success: true, data: letterhead }); // return in `data`
  } catch (err) {
    console.error("Error fetching letterhead:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};


/**
 * @desc Update letterhead by branch ID
 * @route PUT /api/letterheads/:branchId
 * @access Admin
 */
// export const updateLetterhead = async (req, res) => {
//   try {
//     const { branchId } = req.params;

//     const updated = await Letterhead.findOneAndUpdate(
//       { branchId },
//       { $set: req.body },
//       { new: true, runValidators: true }
//     );

//     if (!updated) {
//       return res.status(404).json({ success: false, message: "Letterhead not found for this branch." });
//     }

//     res.status(200).json({ success: true, message: "Letterhead updated successfully.", letterhead: updated });
//   } catch (err) {
//     console.error("Error updating letterhead:", err);
//     res.status(500).json({ success: false, message: "Server error." });
//   }
// };

/**
 * @desc Delete letterhead by ID
 * @route DELETE /api/letterheads/:id
 * @access Admin
 */
export const deleteLetterhead = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Letterhead.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Letterhead not found." });
    }

    res.status(200).json({ success: true, message: "Letterhead deleted successfully." });
  } catch (err) {
    console.error("Error deleting letterhead:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};
