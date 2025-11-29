import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Branch from "../models/Branch.js";

dotenv.config();

export const branchLogin = async (req, res) => {
  console.log("Received body:", req.body);

  try {
    const { loginEmail, loginPassword } = req.body;

    const branch = await Branch.findOne({ loginEmail });
    if (!branch) {
      return res.status(404).json({ success: false, message: "Branch not found" });
    }

    // 🔥 Compare hashed password
    const isMatch = await bcrypt.compare(loginPassword, branch.loginPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // 🔥 Generate token
    const token = jwt.sign(
      { branchId: branch._id, role: "branch" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: "✅ Branch login successful!",
      token,
      branch: {
        _id: branch._id,
        name: branch.name,
        address: branch.address,
        contact: branch.contact,
        gst: branch.gst,
        email: branch.email,           // branch email
        loginEmail: branch.loginEmail, // login email
        place: branch.place,
        branchCode: branch.branchCode,
        status: branch.status,
        logo: branch.logo || null,
      },
    });

  } catch (error) {
    console.error("Branch login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// name,
//       address,
//       place,
//       contact,
//       email,
//       gst,
//       branchCode,
//       status,
//       loginEmail,
//       loginPassword
