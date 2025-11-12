import TestPackage from "../models/TestPackage.js";
import TestPackageRequest from "../models/TestPackageRequest.js";
import Test from "../models/Test.js";
import TestPanel from "../models/TestPanel.js";

/**
 * @desc List all global active test packages
 */
export const listGlobalPackages = async (req, res) => {
  try {
    const packages = await TestPackage.find()
      .populate("tests", "name shortName category")
      .populate("panels", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, packages });
  } catch (err) {
    console.error("Error fetching global packages:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Get a single global test package by ID (Admin only)
 */
export const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("package", id);
    

    const pkg = await TestPackage.findById(id)
      .populate("tests", "name shortName category")
      .populate("panels", "name");

    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    return res.status(200).json({ success: true, data: pkg });
  } catch (err) {
    console.error("Error fetching package by ID:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Add new test package
 * - Admin: directly global
 * - Branch: creates a request
 */
export const addPackage = async (req, res) => {
  try {
    const { name, fee, gender, tests, panels, addToRateList  } = req.body;
    const userType = req.userType; // "admin" or "branch"
    const branchId = req.branchId || null;

    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    if (userType === "admin") {
      // Admin adds package globally
      const existing = await TestPackage.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
      });
      if (existing)
        return res.status(400).json({ success: false, message: "Package already exists globally" });

      const newPackage = new TestPackage({
        name,
        fee,
        gender,
        tests,
        panels,
        createdBy: req.adminId || "admin",
        inRatelist: false, // default not in ratelist
        addToRateList: addToRateList || true,
      });

      await newPackage.save();
      return res
        .status(201)
        .json({ success: true, message: "Test package added globally", data: newPackage });
    } else {
      // Branch request
      if (!branchId)
        return res.status(400).json({ success: false, message: "branchId is required for branch requests" });

      const existingRequest = await TestPackageRequest.findOne({
        name: { $regex: new RegExp(`^${name}$`, "i") },
        branchId,
      });
      if (existingRequest)
        return res.status(400).json({ success: false, message: "You already requested this package" });

      const newRequest = new TestPackageRequest({
        branchId,
        name,
        fee,
        gender,
        tests,
        panels,
        status: "Pending",
        addToRateList: addToRateList || true,
      });

      await newRequest.save();
      return res
        .status(201)
        .json({ success: true, message: "Test package request sent", data: newRequest });
    }
  } catch (err) {
    console.error("Error adding test package:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Admin approves/rejects a branch package request
 */
export const handlePackageRequest = async (req, res) => {
  try {
    const { id } = req.params; // request id
    const { status } = req.body; // "Approved" or "Rejected"

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await TestPackageRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });

    request.status = status;
    await request.save();

    if (status === "Approved") {
      const newPackage = new TestPackage({
        name: request.name,
        fee: request.fee,
        gender: request.gender,
        tests: request.tests,
        panels: request.panels,
        createdBy: "admin",
        inRatelist: false,
        addToRateList: request.addToRateList || true,
      });
      await newPackage.save();
    }

    return res.status(200).json({ success: true, message: `Package request ${status.toLowerCase()}` });
  } catch (err) {
    console.error("Error handling package request:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc List all pending branch package requests (Admin only)
 */
export const listPackageRequests = async (req, res) => {
  try {
    const requests = await TestPackageRequest.find({ status: "Pending" })
      .populate("tests", "name shortName category")
      .populate("panels", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, requests });
  } catch (err) {
    console.error("Error fetching package requests:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Delete a global test package (Admin only)
 */
export const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const pkg = await TestPackage.findByIdAndDelete(id);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    return res.status(200).json({ success: true, message: "Package deleted successfully" });
  } catch (err) {
    console.error("Error deleting package:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Edit an existing global test package (Admin only)
 */
export const editPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fee, gender, tests, panels, addToRateList  } = req.body;

    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const pkg = await TestPackage.findById(id);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    const existing = await TestPackage.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name}$`, "i") },
    });
    if (existing) return res.status(400).json({ success: false, message: "Package name already exists" });

    pkg.name = name;
    pkg.fee = fee;
    pkg.gender = gender;
    pkg.tests = tests;
    pkg.panels = panels;
    pkg.addToRateList = addToRateList || true;

    await pkg.save();

    return res.status(200).json({ success: true, message: "Package updated successfully", data: pkg });
  } catch (err) {
    console.error("Error editing package:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * @desc Toggle inRatelist status of a test package (admin only)
 */
export const toggleRatelist = async (req, res) => {
  try {
    const { id } = req.params; // package ID

    const pkg = await TestPackage.findById(id);
    if (!pkg) return res.status(404).json({ success: false, message: "Package not found" });

    // Toggle inRatelist
    pkg.inRatelist = !pkg.inRatelist;
    await pkg.save();

    return res.status(200).json({
      success: true,
      message: pkg.inRatelist ? "Added to ratelist" : "Removed from ratelist",
      package: pkg,
    });
  } catch (err) {
    console.error("Error toggling ratelist:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
