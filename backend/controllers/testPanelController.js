import TestPanel from "../models/TestPanel.js";
import TestPanelRequest from "../models/TestPanelRequest.js";
import Test from "../models/Test.js";

/**
 * @desc List all global active test panels
 */
export const listGlobalPanels = async (req, res) => {
  try {
    const panels = await TestPanel.find({ status: "Active" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, panels });
  } catch (err) {
    console.error("Error fetching global panels:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a single global test panel by ID (Admin only)
 */
export const getPanelById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("panel", id);
    

    const panel = await TestPanel.findById(id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    return res.status(200).json({ success: true, data: panel });
  } catch (err) {
    console.error("Error fetching panel by ID:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Add new test panel
 * - Admin: directly global
 * - Branch: creates a request
 */
export const addPanel = async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      tests, // now frontend must send full test objects
      hideInterpretation,
      hideMethod,
      interpretation,
    } = req.body;

    const userType = req.userType; // "admin" or "branch"
    const branchId = req.branchId || null;

    if (!name || !category) 
      return res.status(400).json({ success: false, message: "Name and category are required" });

    if (!Array.isArray(tests) || !tests.every((t) => typeof t === "object")) {
      return res.status(400).json({ success: false, message: "Tests must be an array of full test objects" });
    }

    if (userType === "admin") {
      const existing = await TestPanel.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
      if (existing) return res.status(400).json({ success: false, message: "Panel already exists globally" });

      const newPanel = new TestPanel({
        name,
        category,
        price,
        tests, // store full objects
        hideInterpretation,
        hideMethod,
        interpretation,
        status: "Active",
        createdBy: "admin",
      });

      await newPanel.save();
      return res.status(201).json({ success: true, message: "Test panel added globally", data: newPanel });
    } else {
      if (!branchId) return res.status(400).json({ success: false, message: "branchId is required for branch requests" });

      const existingRequest = await TestPanelRequest.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") }, branchId });
      if (existingRequest) return res.status(400).json({ success: false, message: "You already requested this panel" });

      const newRequest = new TestPanelRequest({
        name,
        category,
        price,
        tests,
        hideInterpretation,
        hideMethod,
        interpretation,
        branchId,
        status: "Pending",
      });

      await newRequest.save();
      return res.status(201).json({ success: true, message: "Test panel request sent", data: newRequest });
    }
  } catch (err) {
    console.error("Error adding test panel:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Edit an existing global test panel (Admin only)
 */
export const editPanel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, tests, hideInterpretation, hideMethod, interpretation } = req.body;

    if (!name || !category)
      return res.status(400).json({ success: false, message: "Name and category are required" });

    if (!Array.isArray(tests) || !tests.every((t) => typeof t === "object")) {
      return res.status(400).json({ success: false, message: "Tests must be an array of full test objects" });
    }

    const panel = await TestPanel.findById(id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    const existing = await TestPanel.findOne({ _id: { $ne: id }, name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existing) return res.status(400).json({ success: false, message: "Panel name already exists" });

    panel.name = name;
    panel.category = category;
    panel.price = price;
    panel.tests = tests; // now stores full test objects
    panel.hideInterpretation = hideInterpretation;
    panel.hideMethod = hideMethod;
    panel.interpretation = interpretation;

    await panel.save();

    return res.status(200).json({ success: true, message: "Panel updated successfully", data: panel });
  } catch (err) {
    console.error("Error editing panel:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Admin approves/rejects a branch panel request
 */
export const handlePanelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await TestPanelRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const newPanel = new TestPanel({
        name: request.name,
        category: request.category,
        price: request.price,
        tests: request.tests, // full test objects
        hideInterpretation: request.hideInterpretation,
        hideMethod: request.hideMethod,
        interpretation: request.interpretation,
        status: "Active",
        createdBy: "admin",
      });
      await newPanel.save();
    }

    return res.status(200).json({ success: true, message: `Panel request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Error handling panel request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc List all pending branch panel requests (Admin only)
 */
export const listPanelRequests = async (req, res) => {
  try {
    const requests = await TestPanelRequest.find({ status: "Pending" }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching panel requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Delete a global test panel (Admin only)
 */
export const deletePanel = async (req, res) => {
  try {
    const { id } = req.params;

    const panel = await TestPanel.findByIdAndDelete(id);
    if (!panel) return res.status(404).json({ success: false, message: "Panel not found" });

    return res.status(200).json({ success: true, message: "Panel deleted successfully" });
  } catch (err) {
    console.error("Error deleting panel:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
