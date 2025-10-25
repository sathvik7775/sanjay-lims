import React, { useContext, useState } from "react";
import { Building2, Save, ArrowLeft, Upload, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
 // adjust path as needed
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";
import { useEffect } from "react";

const AddBranch = () => {
  const navigate = useNavigate();
  const { successToast, errorToast, adminToken } = useContext(LabContext); // from context
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    place: "",
    contact: "",
    email: "",
    gst: "",
    branchCode: "",
    status: "Active",
    logo: null,
    loginEmail: "",
    loginPassword: "",
  });

  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
    }
  };

  // Validation
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

  // ✅ Handle form submit with axios + loader + toast
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      formDataToSend.append(key, formData[key]);
    });

    try {
      setLoading(true); // show loader

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/branch/add`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        successToast("Branch added successfully!");
        navigate("/admin/branches");
      } else {
        errorToast(response.data.message || "Failed to add branch");
      }
    } catch (error) {
      console.error("Error adding branch:", error);
      errorToast(
        error.response?.data?.message || "Something went wrong while adding branch"
      );
    } finally {
      setLoading(false); // hide loader
    }
  };

  useEffect(() => {
      if (!adminToken) {
        navigate("/admin-login");
      }
    }, [adminToken, navigate]);

  return (

    <>
    
    {loading && <Loader/>}
    <div className="p-6">

      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-600" /> Add New Branch
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
        className="bg-white shadow-md rounded-lg p-6 border max-w-3xl"
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

          {/* Place */}
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
              <p className="text-red-500 text-xs mt-1">{errors.loginPassword}</p>
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
          <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Branch Logo
            </label>
            <div
              className="border border-dashed rounded-md p-4 text-center relative cursor-pointer hover:bg-gray-50"
              onClick={() => document.getElementById("branchLogoInput").click()}
            >
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
            </div>
            <input
              id="branchLogoInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4" /> Save Branch
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default AddBranch;
