import React, { useState, useEffect, useContext } from "react";
import { Building2, Save, ArrowLeft, Upload, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

const EditBranch = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {successToast, errorToast, adminToken} = useContext(LabContext)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    place: "",
    contact: "",
    email: "",
    gst: "",
    branchCode: "",
    loginEmail: "",
    loginPassword: "",
    status: "Active",
    logo: null,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // 🟩 Load branch from backend
  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/branch/${id}`,
          {
            headers: { Authorization: `Bearer ${adminToken}` },
          }
        );

        setFormData({
          ...res.data,
          logo: null, // reset logo to prevent object reference issues
        });
      } catch (error) {
        console.error("Error fetching branch:", error);
        errorToast("Failed to load branch data!");
        navigate("/admin/branches");
      } finally {
        setLoading(false);
      }
    };

    if (adminToken) fetchBranch();
  }, [id, navigate, adminToken, errorToast]);

  // 🟦 Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🟨 Handle logo upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  // 🟥 Validation
  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Branch name is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.place) newErrors.place = "City/Place is required";
    if (!formData.contact) newErrors.contact = "Contact number is required";
    else if (!/^\d{10}$/.test(formData.contact))
      newErrors.contact = "Enter a valid 10-digit number";
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (formData.gst && formData.gst.length !== 15)
      newErrors.gst = "GST number must be 15 characters";
    if (!formData.loginEmail) newErrors.loginEmail = "Login email is required";
    else if (!/^\S+@\S+\.\S+$/.test(formData.loginEmail))
      newErrors.loginEmail = "Invalid email format";
    if (!formData.loginPassword)
      newErrors.loginPassword = "Login password is required";
    else if (formData.loginPassword.length < 6)
      newErrors.loginPassword = "Password must be at least 6 characters";
    return newErrors;
  };

  // 🟩 Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) form.append(key, value);
      });

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/branch/edit/${id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      successToast("✅ Branch updated successfully!");
      navigate("/admin/branches");
    } catch (error) {
      console.error("Update failed:", error);
      errorToast("❌ Failed to update branch.");
    }
  };

  useEffect(() => {
        if (!adminToken) {
          navigate("/admin-login");
        }
      }, [adminToken, navigate]);

  if (loading) return <Loader/>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> Edit Branch —{" "}
          <span className="text-gray-500 text-sm">#{id}</span>
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-6 border max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.name ? "border-red-500" : ""
              }`}
              placeholder="e.g. Sanjay Diagnostics"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Branch Code */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Branch Code
            </label>
            <input
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="e.g. BR001"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm h-20 ${
                errors.address ? "border-red-500" : ""
              }`}
              placeholder="Enter full address"
            ></textarea>
            {errors.address && (
              <p className="text-red-500 text-xs mt-1">{errors.address}</p>
            )}
          </div>

          {/* City / Place */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              City / Place <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center border rounded-md px-3">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <input
                name="place"
                value={formData.place}
                onChange={handleChange}
                className={`w-full py-2 text-sm outline-none ${
                  errors.place ? "text-red-600" : ""
                }`}
                placeholder="e.g. Bengaluru"
              />
            </div>
            {errors.place && (
              <p className="text-red-500 text-xs mt-1">{errors.place}</p>
            )}
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.contact ? "border-red-500" : ""
              }`}
              placeholder="10-digit number"
            />
            {errors.contact && (
              <p className="text-red-500 text-xs mt-1">{errors.contact}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Email ID
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.email ? "border-red-500" : ""
              }`}
              placeholder="example@mail.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* GST */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              GST Number
            </label>
            <input
              name="gst"
              value={formData.gst}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.gst ? "border-red-500" : ""
              }`}
              placeholder="15-character GSTIN"
            />
            {errors.gst && (
              <p className="text-red-500 text-xs mt-1">{errors.gst}</p>
            )}
          </div>

          {/* Login Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Login Email <span className="text-red-500">*</span>
            </label>
            <input
              name="loginEmail"
              value={formData.loginEmail}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.loginEmail ? "border-red-500" : ""
              }`}
              placeholder="branchlogin@mail.com"
            />
            {errors.loginEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.loginEmail}</p>
            )}
          </div>

          {/* Login Password */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Login Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="loginPassword"
              value={formData.loginPassword}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 text-sm ${
                errors.loginPassword ? "border-red-500" : ""
              }`}
              placeholder="Enter password"
            />
            {errors.loginPassword && (
              <p className="text-red-500 text-xs mt-1">
                {errors.loginPassword}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Logo Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Branch Logo
            </label>
            <div className="border border-dashed rounded-md p-4 text-center relative">
              {formData.logo ? (
                <div className="flex flex-col items-center">
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="Branch Logo"
                    className="w-24 h-24 object-cover rounded-md mb-2"
                  />
                  <p className="text-sm text-gray-600">{formData.logo.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="w-6 h-6 mx-auto text-gray-500 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload or drag & drop
                  </p>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="opacity-0 absolute inset-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" /> Update Branch
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBranch;
