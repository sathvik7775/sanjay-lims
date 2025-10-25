
import path from "path";
import fs from "fs";
import Branch from "../models/Branch.js";

// ✅ Add Branch
import bcrypt from "bcryptjs";

export const addBranch = async (req, res) => {
  try {
    const {
      name,
      address,
      place,
      contact,
      email,
      gst,
      branchCode,
      status,
      loginEmail,
      loginPassword,
    } = req.body;

    const logo = req.file ? `/uploads/${req.file.filename}` : null;

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(loginPassword, 10);

    const branch = await Branch.create({
      name,
      address,
      place,
      contact,
      email,
      gst,
      branchCode,
      status,
      logo,
      loginEmail,
      loginPassword: hashedPassword, // store hashed password
    });

    res.status(201).json({
      success: true,
      message: "Branch added successfully",
      branch,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


// ✅ Get All Branches
export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });
    res.json({ success: true, branches });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch branches" });
  }
};

// ✅ Edit Branch
export const editBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If password is being updated, hash it
    if (updates.loginPassword) {
      updates.loginPassword = await bcrypt.hash(updates.loginPassword, 10);
    }

    // If a new logo is uploaded, remove old one
    if (req.file) {
      const branch = await Branch.findById(id);
      if (branch.logo) {
        const oldPath = path.join("public", branch.logo);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.logo = `/uploads/${req.file.filename}`;
    }

    const updatedBranch = await Branch.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedBranch)
      return res.status(404).json({ success: false, message: "Branch not found" });

    res.json({ success: true, message: "Branch updated successfully", branch: updatedBranch });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating branch" });
  }
};


// ✅ Delete Branch
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);

    if (!branch)
      return res.status(404).json({ success: false, message: "Branch not found" });

    if (branch.logo) {
      const logoPath = path.join("public", branch.logo);
      if (fs.existsSync(logoPath)) fs.unlinkSync(logoPath);
    }

    await Branch.findByIdAndDelete(id);
    res.json({ success: true, message: "Branch deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting branch" });
  }
};

// ✅ Toggle Active/Inactive
export const toggleBranchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const branch = await Branch.findById(id);

    if (!branch)
      return res.status(404).json({ success: false, message: "Branch not found" });

    branch.status = branch.status === "Active" ? "Inactive" : "Active";
    await branch.save();

    res.json({
      success: true,
      message: `Branch marked as ${branch.status}`,
      branch,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

// ✅ Get single branch by ID
export const getBranchById = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: "Branch not found" });
    }
    res.json(branch);
  } catch (error) {
    console.error("Error fetching branch:", error);
    res.status(500).json({ message: "Server error" });
  }
};

