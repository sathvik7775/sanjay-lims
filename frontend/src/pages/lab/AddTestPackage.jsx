import React, { useState, useContext } from "react";
import Select from "react-select";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const AddTestPackage = () => {
  const {
    dummyTests, // fetched real tests
    dummyPanels, // fetched real panels
    branchToken,
    adminToken,
    successToast,
    errorToast,
    userType = "admin",
    branchId,
  } = useContext(LabContext);

  const [formData, setFormData] = useState({
    name: "",
    fee: "",
    gender: "Both",
    tests: [],
    panels: [],
  });

  const [loading, setLoading] = useState(false);

  // ✅ Utility for updating multi-select fields
  const handleSelectChange = (selectedOptions, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selectedOptions ? selectedOptions.map((o) => o.value) : [],
    }));
  };

  // ✅ Submit form data to backend
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    setLoading(true);

    // Prepare payload
    const payload = {
      name: formData.name,
      fee: formData.fee,
      gender: formData.gender,
      tests: formData.tests,
      panels: formData.panels,
    };

    // Determine URL and headers
    let url = "";
    let headers = {};

    if (adminToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/packages/admin/add`;
      headers = { Authorization: `Bearer ${adminToken}` };
    } else if (branchToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/packages/add`;
      headers = { Authorization: `Bearer ${branchToken}` };
      payload.branchId = branchId; // only for branch requests
    } else {
      errorToast?.("Unauthorized! Please login.");
      return;
    }

    // Send request
    const res = await axios.post(url, payload, { headers });

    if (res.data.success) {
      successToast(
        adminToken
          ? "Package added successfully!"
          : "Package request sent for approval!"
      );

      setFormData({
        name: "",
        fee: "",
        gender: "Both",
        tests: [],
        panels: [],
      });
    } else {
      errorToast("Something went wrong while saving the package.");
    }
  } catch (err) {
    console.error("Error adding test package:", err);
    errorToast(
      err.response?.data?.message ||
        "Failed to save package. Please try again."
    );
  } finally {
    setLoading(false);
  }
};


  // ✅ Options for selects
  const testOptions = dummyTests.map((t) => ({
    value: t._id,
    label: `${t.name}${t.shortName ? ` (${t.shortName})` : ""}`,
  }));

  const panelOptions = dummyPanels.map((p) => ({
    value: p._id,
    label: p.name,
  }));


  if (loading) return <Loader/>;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Add New Test Package</h2>
        <p className="text-gray-500 text-sm">
          A test package is made up of individual tests and panels. If you find
          any missing, please add them before creating the package.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
            required
          />
        </div>

        {/* Fee */}
        <div>
          <label className="block text-sm font-medium mb-1">Fee</label>
          <input
            type="number"
            value={formData.fee}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, fee: e.target.value }))
            }
            className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Bill only for gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, gender: e.target.value }))
            }
            className="w-full border rounded-md px-3 py-2 focus:ring focus:ring-blue-300"
          >
            <option value="Both">Both</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Tests */}
        <div>
          <label className="text-sm font-medium mb-1 flex justify-between">
            <span>Tests</span>
            <a href="#" className="text-blue-600 text-sm hover:underline">
              View all ↗
            </a>
          </label>
          <Select
            isMulti
            options={testOptions}
            onChange={(selected) => handleSelectChange(selected, "tests")}
            classNamePrefix="react-select"
            placeholder="Search and select tests..."
            value={testOptions.filter((t) => formData.tests.includes(t.value))}
          />
          <p className="text-xs text-gray-500 mt-1">
            Search by typing full test name or short name.
          </p>
        </div>

        {/* Panels */}
        <div>
          <label className="text-sm font-medium mb-1 flex justify-between">
            <span>Panels</span>
            <a href="#" className="text-blue-600 text-sm hover:underline">
              View all ↗
            </a>
          </label>
          <Select
            isMulti
            options={panelOptions}
            onChange={(selected) => handleSelectChange(selected, "panels")}
            classNamePrefix="react-select"
            placeholder="Search and select panels..."
            value={panelOptions.filter((p) => formData.panels.includes(p.value))}
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-start gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() =>
              setFormData({
                name: "",
                fee: "",
                gender: "Both",
                tests: [],
                panels: [],
              })
            }
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTestPackage;
