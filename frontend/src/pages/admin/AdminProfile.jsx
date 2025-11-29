import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import { Eye, EyeOff } from "lucide-react";

const AdminProfile = () => {
  const { adminToken, successToast, errorToast } = useContext(LabContext);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false); // 👁️ Toggle state

  useEffect(() => {
    fetchAdminDetails();
  }, []);

  const fetchAdminDetails = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/adminlogin/profile`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      setEmail(res.data.data.email);
    } catch (err) {
      errorToast("Failed to load profile");
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/adminlogin/profile`,
        { email, password: newPassword },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast("Profile updated successfully");
        setNewPassword("");
      } else {
        errorToast(res.data.message);
      }
    } catch (err) {
      errorToast(err.response?.data?.message || "Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Admin Profile</h2>

      {/* Email */}
      <label className="block mb-2 font-medium">Email</label>
      <input
        type="email"
        className="border px-3 py-2 rounded w-full mb-4"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Password Input + Eye */}
      <label className="block mb-2 font-medium">New Password</label>
      <div className="relative mb-4">
        <input
          type={showPass ? "text" : "password"}
          className="border px-3 py-2 rounded w-full pr-10"
          placeholder="Leave blank to keep the same password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {/* 👁️ Eye Icon */}
        <span
          onClick={() => setShowPass(!showPass)}
          className="absolute right-3 top-2.5 cursor-pointer text-gray-600"
        >
          {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
        </span>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </div>
  );
};

export default AdminProfile;
