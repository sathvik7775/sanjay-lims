import mongoose from "mongoose";
import Case from "../models/Case.js";
import { io } from "../server.js";

/**
 * @desc Add new case
 */
export const createCase = async (req, res) => {
  try {
    const { branchId, patient, tests, categories, payment } = req.body;

    if (!branchId) return res.status(400).json({ success: false, message: "Branch ID is required" });

    // Ensure tests is a Map of arrays of IDs
    const formattedTests = {};
    if (tests && typeof tests === "object") {
      Object.keys(tests).forEach((cat) => {
        formattedTests[cat] = Array.isArray(tests[cat]) ? tests[cat] : [];
      });
    }

    // Auto-calculate balance and status
    const total = payment?.total || 0;
    const discount = payment?.discount || 0;
    const received = payment?.received || 0;
    const balance = total - discount - received;
    const status = balance > 0 ? "due" : "no due";

    const newCase = new Case({
      branchId,
      patient,
      tests: formattedTests,
      categories: categories || [],
      payment: { ...payment, balance },
      status,
    });

    await newCase.save();

    io.emit("new_case", {
      caseId: newCase._id,
      patientName: `${newCase.patient?.firstName || ""} ${newCase.patient?.lastName || ""}`,
      branch: newCase.branchId, // optional
      message: "A new case has been created",
    });

    return res.status(201).json({ success: true, data: newCase });
  } catch (error) {
    console.error("Create Case Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc Edit/update a case
 */
export const updateCase = async (req, res) => {
  try {
    const { id } = req.params;

    const caseToUpdate = await Case.findById(id);
    if (!caseToUpdate) return res.status(404).json({ success: false, message: "Case not found" });

    const updatedData = { ...req.body };

    // Update balance & status if payment info is updated
    if (updatedData.payment) {
      const total = updatedData.payment.total ?? caseToUpdate.payment.total;
      const discount = updatedData.payment.discount ?? caseToUpdate.payment.discount;
      const received = updatedData.payment.received ?? caseToUpdate.payment.received;
      const balance = total - discount - received;

      updatedData.payment.balance = balance;
      if (!updatedData.status) updatedData.status = balance > 0 ? "due" : "no due";
    }

    // Ensure tests are formatted as Map of arrays of IDs
    if (updatedData.tests && typeof updatedData.tests === "object") {
      const formattedTests = {};
      Object.keys(updatedData.tests).forEach((cat) => {
        formattedTests[cat] = Array.isArray(updatedData.tests[cat]) ? updatedData.tests[cat] : [];
      });
      updatedData.tests = formattedTests;
    }

    const updatedCase = await Case.findByIdAndUpdate(id, updatedData, { new: true });
    return res.status(200).json({ success: true, data: updatedCase });
  } catch (error) {
    console.error("Update Case Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc Get all cases (Admin)
 */
export const getAllCases = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error("Get All Cases Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * @desc Get cases by branchId
 */


export const getCasesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    console.log(branchId);
    

    // Convert to ObjectId if branchId is stored as ObjectId in DB
    const cases = await Case.find({branchId})
      .sort({ createdAt: -1 })
      // populate references
      .populate("branchId", "name code location")   // populate branch details
                // populate agent info
            // populate panels if nested like { panelId, quantity }

    return res.status(200).json({ success: true, data: cases });
  } catch (error) {
    console.error("Get Cases By Branch Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};



/**
 * @desc Get single case by ID
 */
export const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("case", id);
    

    // Safety check
    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: "Invalid or missing Case ID" });
    }

    const singleCase = await Case.findById(id);
    if (!singleCase)
      return res.status(404).json({ success: false, message: "Case not found" });

    return res.status(200).json({ success: true, data: singleCase });
  } catch (error) {
    console.error("Get Case By ID Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * @desc Delete case by ID
 */
export const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Case.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Case not found" });

    return res.status(200).json({ success: true, message: "Case deleted successfully" });
  } catch (error) {
    console.error("Delete Case Error:", error);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
};





