import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(401).json({ success: false, message: "Invalid email" });

    const validPass = await bcrypt.compare(password, admin.password);
    if (!validPass)
      return res.status(401).json({ success: false, message: "Invalid password" });

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      message: "Admin login successful",
      token,
      admin: { email: admin.email },
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getAdminProfile = async (req, res) => {
  try {
    // Get full admin including password
    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({
      success: true,
      data: {
        email: admin.email,
        password: admin.password // <<--- RETURN PASSWORD
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



export const updateAdminProfile = async (req, res) => {
  try {
    const { email, password } = req.body;

    const updateData = {};

    if (email) updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const updated = await Admin.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
    });

    res.json({ success: true, message: "Admin updated", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
