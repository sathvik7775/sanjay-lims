import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const AddLetterhead = () => {
  const { adminToken, errorToast, successToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false)

  // ✅ Unified form data state
  const [formData, setFormData] = useState({
    headerImage: null,
    footerImage: null,
    headerHeight: "",
    footerHeight: "",
  });

  // 🔹 Fetch branches
  const fetchBranches = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/branch/list`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const branchList = res.data?.branches || res.data || [];
      setBranches(branchList);
      if (branchList.length > 0) setSelectedBranch(branchList[0]._id);
    } catch (err) {
      console.error(err);
      errorToast("Failed to load branches");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // 🔹 Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return errorToast("Select a branch first");
    if (!formData.headerImage || !formData.footerImage)
      return errorToast("Please upload both header and footer images");

    try {
      setLoading(true)
      const form = new FormData();
      form.append("branchId", selectedBranch);
      form.append("headerHeight", formData.headerHeight);
      form.append("footerHeight", formData.footerHeight);
      form.append("headerImage", formData.headerImage);
      form.append("footerImage", formData.footerImage);

      const url = `${import.meta.env.VITE_API_URL}/api/report/letterhead/admin/add`;

      const res = await axios.post(url, form, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        successToast("Letterhead added successfully");
        setFormData({
          headerImage: null,
          footerImage: null,
          headerHeight: "",
          footerHeight: "",
        });
      }
    } catch (err) {
      setLoading(false)
      console.error("❌ Error creating letterhead:", err);
      errorToast(err.response?.data?.message || "Failed to add letterhead");
    } finally{
      setLoading(false)
    }
  };

  if (loading) return <Loader/>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Add Letterhead
      </h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-white p-6 rounded shadow space-y-4"
        encType="multipart/form-data"
      >
        {/* Branch Selector */}
        <div>
          <label className="block mb-1 font-medium">Select Branch</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">Select Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Header Image Upload */}
        <div>
          <label className="block mb-1 font-medium">Header Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                headerImage: e.target.files[0],
              }))
            }
            className="w-full border p-2 rounded"
            required
          />
          {formData.headerImage && (
            <img
              src={URL.createObjectURL(formData.headerImage)}
              alt="Header Preview"
              className="mt-2 h-20 object-cover rounded border"
            />
          )}
        </div>

        {/* Header Height */}
        <div>
          <label className="block mb-1 font-medium">Header Height (px)</label>
          <input
            type="number"
            value={formData.headerHeight}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                headerHeight: e.target.value,
              }))
            }
            className="w-full border p-2 rounded"
            placeholder="e.g. 150"
            required
          />
        </div>

        {/* Footer Image Upload */}
        <div>
          <label className="block mb-1 font-medium">Footer Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                footerImage: e.target.files[0],
              }))
            }
            className="w-full border p-2 rounded"
            required
          />
          {formData.footerImage && (
            <img
              src={URL.createObjectURL(formData.footerImage)}
              alt="Footer Preview"
              className="mt-2 h-20 object-cover rounded border"
            />
          )}
        </div>

        {/* Footer Height */}
        <div>
          <label className="block mb-1 font-medium">Footer Height (px)</label>
          <input
            type="number"
            value={formData.footerHeight}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                footerHeight: e.target.value,
              }))
            }
            className="w-full border p-2 rounded"
            placeholder="e.g. 120"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Letterhead
        </button>
      </form>
    </div>
  );
};

export default AddLetterhead;
