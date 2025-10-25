import React, { useState, useEffect, useContext } from "react";
import { LabContext } from "../../context/LabContext";
import axios from "axios";

const AddLetterhead = () => {
  const { adminToken, errorToast, successToast } = useContext(LabContext);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    subName: "",
    address: "",
    contact: "",
    email: "",
    tagline: "",
    website: "",
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

  // Save letterhead
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBranch) return errorToast("Select a branch first");

    try {
      const payload = { ...formData, branchId: selectedBranch };
      const url = `${import.meta.env.VITE_API_URL}/api/report/letterhead/admin/add`;
      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success) {
        successToast("Letterhead added successfully");
        setFormData({
          name: "",
          subName: "",
          address: "",
          contact: "",
          email: "",
          tagline: "",
          website: "",
        });
      }
    } catch (err) {
      console.error(err);
      errorToast("Failed to add letterhead");
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Add Letterhead
      </h2>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto bg-white p-4 rounded shadow space-y-4"
      >
        {/* Lab/Branch Name */}
        <div>
          <label className="block mb-1 font-medium">Lab/Branch Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            className="w-full border p-2 rounded"
            required
          />
        </div>

        {/* Sub Name */}
        <div>
          <label className="block mb-1 font-medium">Sub Name</label>
          <input
            type="text"
            name="subName"
            value={formData.subName}
            onChange={(e) =>
              setFormData(prev => ({ ...prev, subName: e.target.value }))
            }
            className="w-full border p-2 rounded"
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

        {/* Remaining Fields */}
        {[
          { label: "Address", name: "address" },
          { label: "Contact Number", name: "contact" },
          { label: "Email", name: "email" },
          { label: "Website", name: "website" },
          { label: "Tagline", name: "tagline" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block mb-1 font-medium">{field.label}</label>
            <input
              type="text"
              name={field.name}
              value={formData[field.name]}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, [field.name]: e.target.value }))
              }
              className="w-full border p-2 rounded"
            />
          </div>
        ))}

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
