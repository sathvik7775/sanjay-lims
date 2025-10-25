import React, { useState, useEffect, useContext } from "react";
import { LabContext } from "../../context/LabContext";
import axios from "axios";
import Loader from "../../components/Loader";

const AddSignature = () => {
  const { adminToken, errorToast, successToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    image: null, // file
  });

  // Fetch branches
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return errorToast("Select a branch first");
    if (!formData.image) return errorToast("Select an image first");

    try {
      setLoading(true)
      const payload = new FormData();
      payload.append("branchId", selectedBranch);
      payload.append("name", formData.name);
      payload.append("designation", formData.designation);
      payload.append("image", formData.image);

      const url = `${import.meta.env.VITE_API_URL}/api/report/signature/admin/add`;
      const res = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        successToast("Signature added successfully");
        setFormData({ name: "", designation: "", image: null });
      }
    } catch (err) {
      setLoading(false)
      console.error(err);
      errorToast("Failed to add signature");
    } finally{
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  if (loading) return <Loader/>

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Add Signature
      </h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-white p-4 rounded shadow space-y-4"
      >
        {/* Name */}
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Designation */}
        <div>
          <label className="block mb-1 font-medium">Designation</label>
          <input
            type="text"
            value={formData.designation}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, designation: e.target.value }))
            }
            className="w-full border p-2 rounded"
            required
          />
        </div>

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

        {/* Image Upload */}
        <div>
          <label className="block mb-1 font-medium">Signature Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, image: e.target.files[0] }))
            }
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Signature
        </button>
      </form>
    </div>
  );
};

export default AddSignature;
