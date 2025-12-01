// src/pages/Admin/ReportTemplates.jsx
import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import TestReferenceRanges from "../../components/TestReferenceRanges";
import Loader from "../../components/Loader";

const ReportTemplates = () => {
  const { adminToken, branchToken, errorToast, categories, isPublicPage} = useContext(LabContext);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Fetch all reference ranges
  const fetchReferenceRanges = async () => {
    let url;
    if (adminToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/reference-ranges`;
    } else if (branchToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/database/reference-ranges`;
    } else {
      
      return {};
    }

    const headers = {
      Authorization: `Bearer ${adminToken || branchToken}`,
    };

    try {
      const res = await axios.get(url, { headers });
      if (!res.data.success) return {};

      const ranges = res.data.data || [];

      // ✅ Group by testId for easy mapping
      // ✅ Group by testId for easy mapping
const grouped = ranges.reduce((acc, r) => {
  const id = r.testId;
  if (!id) return acc;
  if (!acc[id]) acc[id] = [];

  acc[id].push({
    _id: r._id,
    which: r.which || "Numeric", // use `which` from DB
    sex: r.sex || "Any",
    minAge: r.minAge,
    minUnit: r.minUnit,
    maxAge: r.maxAge,
    maxUnit: r.maxUnit,
    lower: r.lower,
    upper: r.upper,
    textValue: r.textValue || "",       // ✅ for Text type
    displayText: r.displayText || r.textValue || (r.lower != null && r.upper != null ? `${r.lower} - ${r.upper}` : "-"),
    parameterName: r.parameterName || "",
  });

  return acc;
}, {});


      return grouped;
    } catch (err) {
      console.error("Failed to fetch reference ranges", err);
      errorToast("Failed to fetch reference ranges");
      return {};
    }
  };

  // ✅ Fetch all tests and merge their reference ranges
  const fetchTests = async () => {
    if (isPublicPage) return;
    let url;
    if (adminToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/database/admin/list`;
    } else if (branchToken) {
      url = `${import.meta.env.VITE_API_URL}/api/test/database/list`;
    } else {
      
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${adminToken || branchToken}`,
    };

    try {
      setLoading(true);
      const refRangesByTest = await fetchReferenceRanges();

      const res = await axios.get(url, { headers });
      const templates = res.data?.tests || [];

      // ✅ Merge tests with reference ranges
      const mergedTests = await Promise.all(
  templates.map(async (t) => {
    let unit = t.unit || "";

    // Fetch unit if missing
    if (!unit) {
      try {
        const testUrl = adminToken
          ? `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${t._id}`
          : `${import.meta.env.VITE_API_URL}/api/test/database/test/${t._id}`;

        const testRes = await axios.get(testUrl, { headers });
        unit = testRes.data.success ? testRes.data.data?.unit || "" : "";
      } catch (err) {
        console.error(`Failed to fetch unit for testId ${t._id}`, err);
      }
    }

    const references = refRangesByTest[t._id] || [];
    return { ...t, unit, references };
  })
);


      setTests(mergedTests.slice().reverse());
    } catch (err) {
      console.error(err);
      errorToast("Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const filteredTests =
    selectedCategory === "All"
      ? tests
      : tests.filter((t) => t.category === selectedCategory);

  if (loading) return <Loader />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-center">Report Templates</h2>

      {/* ✅ Category filter */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <button
          onClick={() => setSelectedCategory("All")}
          className={`px-4 py-1 rounded-full border transition ${
            selectedCategory === "All"
              ? "bg-blue-500 text-white border-blue-500"
              : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
          }`}
        >
          All
        </button>

        {categories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-4 py-1 rounded-full border transition ${
              selectedCategory === cat.name
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-gray-100 text-gray-700 border-gray-400 hover:bg-gray-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* ✅ Tests list */}
      {filteredTests.length === 0 ? (
        <p className="text-center text-gray-500">No tests found.</p>
      ) : (
        <div className="space-y-4">
          {filteredTests.map((test) => (
            <TestReferenceRanges
              key={test._id}
              testId={test._id}
              testName={test.name || test.testName}
              testUnit={test.unit}
              references={test.references}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportTemplates;
