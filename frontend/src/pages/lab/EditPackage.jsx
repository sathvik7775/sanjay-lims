import React, { useState, useContext, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const EditPackage = () => {
  const { id } = useParams(); // package ID
  const navigate = useNavigate();

  const { dummyTests, dummyPanels, adminToken, successToast, errorToast } =
    useContext(LabContext);

  const [formData, setFormData] = useState({
  name: "",
  fee: "",
  gender: "Both",
  tests: [],
  panels: [],
  addToRateList: false, // ✅ Added
});


  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Fetch package details
  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setFetching(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data.success) {
          const pkg = res.data.data;
          setFormData({
            name: pkg.name || "",
            fee: pkg.fee || "",
            gender: pkg.gender || "Both",
            tests: (pkg.tests || []).map((t) => t._id),
            panels: (pkg.panels || []).map((p) => p._id),
            addToRateList: pkg.addToRateList ?? false,
          });
        } else {
          errorToast("Failed to fetch package data.");
        }
      } catch (err) {
        console.error("Error fetching package:", err);
        errorToast(err.response?.data?.message || "Failed to fetch package.");
      } finally {
        setFetching(false);
      }
    };

    fetchPackage();
  }, [id, adminToken]);

  const handleSelectChange = (selectedOptions, field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: selectedOptions ? selectedOptions.map((o) => o.value) : [],
    }));
  };

  // Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
  name: formData.name,
  fee: formData.fee,
  gender: formData.gender,
  tests: formData.tests,
  panels: formData.panels,
  addToRateList: formData.addToRateList, // ✅ Added
};


      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/test/packages/admin/edit/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success) {
        successToast("Package updated successfully!");
        navigate("/admin/test-packages");
      } else {
        errorToast("Failed to update package.");
      }
    } catch (err) {
      console.error("Error updating package:", err);
      errorToast(err.response?.data?.message || "Failed to update package.");
    } finally {
      setLoading(false);
    }
  };

  const testOptions = dummyTests.map((t) => ({
    value: t._id,
    label: `${t.name}${t.shortName ? ` (${t.shortName})` : ""}`,
  }));

  const panelOptions = dummyPanels.map((p) => ({
    value: p._id,
    label: p.name,
  }));

  if (fetching) return <Loader />;

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white rounded-lg shadow p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-1">Edit Test Package</h2>
        <p className="text-gray-500 text-sm">
          Update package details, included tests and panels.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
        </div>

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

        {/* Add To Rate List */}
<div className="flex items-center gap-2 mt-3">
  <input
    type="checkbox"
    id="addToRateList"
    checked={formData.addToRateList}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        addToRateList: e.target.checked,
      }))
    }
  />
  <label htmlFor="addToRateList" className="text-sm font-medium">
    Add to Rate List
  </label>
</div>


        <div className="flex justify-start gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Package"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="border border-gray-300 text-gray-700 px-5 py-2 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditPackage;
