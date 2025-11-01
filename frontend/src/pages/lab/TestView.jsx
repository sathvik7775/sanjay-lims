import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import Select from "react-select";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";
import { GripVertical, Edit3, Plus, Edit } from "lucide-react";

const TestView = () => {
  const { id } = useParams();
  const { adminToken, errorToast, successToast, navigate, branchToken } = useContext(LabContext);

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [allTests, setAllTests] = useState([]);
  const [formulaData, setFormulaData] = useState({
    dependentTests: [],
    expression: "",
  });
  const [existingFormula, setExistingFormula] = useState(null);

  // 🧩 Fetch single test details
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data.success) setTest(res.data.data);
        else errorToast?.(res.data.message || "Failed to fetch test");
      } catch (err) {
        console.error("Error fetching test:", err);
        errorToast?.("Failed to fetch test");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  // 🧠 Fetch all tests for formula dropdown
  useEffect(() => {
    const fetchAllTests = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/list`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        if (res.data.success) setAllTests(res.data.tests);
      } catch (err) {
        console.error("Error fetching all tests:", err);
      }
    };
    fetchAllTests();
  }, []);

  // 🧮 Fetch existing formula (if any)
 useEffect(() => {
  const fetchFormula = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/formula/${id}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (res.data.success && res.data.data) {
        const formula = res.data.data;
        setExistingFormula(formula);

        // ✅ Properly map nested dependencies
        setFormulaData({
  expression: formula.formulaString || "",
  dependentTests:
    formula.dependencies?.map((dep) => ({
      value: dep.testName || dep.testId?.name || "Unnamed Test",
      label: dep.testName || dep.testId?.name || "Unnamed Test",
    })) || [],
});

      }
    } catch (err) {
      console.error("Error fetching formula:", err);
    }
  };

  if (test?.isFormula === true) fetchFormula();
}, [test]);


  // Convert to react-select format
  const testOptions = allTests.map((t) => ({
    value: t._id,
    label: `${t.name} (${t.shortName || "-"})`,
  }));

  // 🧮 Save or Update Formula
  const handleSaveFormula = async () => {
    if (!formulaData.expression)
      return errorToast("Formula expression is required");

    const payload = {
      testId: id,
      testName: test.name,
      formulaString: formulaData.expression,
      dependencies: formulaData.dependentTests.map((t) => t.value),
    };

    try {
      const url = existingFormula
        ? `${import.meta.env.VITE_API_URL}/api/formula/update/${id}`
        : `${import.meta.env.VITE_API_URL}/api/formula/add`;

      const res = await axios.post(url, payload, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (res.data.success) {
        successToast(
          existingFormula
            ? "Formula updated successfully"
            : "Formula added successfully"
        );
        setShowFormulaModal(false);
        setExistingFormula(res.data.data);
      } else {
        errorToast(res.data.message);
      }
    } catch (err) {
      console.error("Error saving formula:", err);
      errorToast("Failed to save formula");
    }
  };

  const renderParameters = (parameters) => (
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full border border-gray-200 text-sm text-gray-700">
        <thead className="bg-[#F8FAFC] border-b text-gray-600">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ORDER</th>
            <th className="px-3 py-2 text-left font-medium">NAME</th>
            <th className="px-3 py-2 text-left font-medium">OPTIONAL</th>
            <th className="px-3 py-2 text-left font-medium">UNIT</th>
            <th className="px-3 py-2 text-left font-medium">Value</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((param, idx) => (
            <tr key={param._id || idx} className="bg-white">
              <td className="px-3 py-2 border-b flex items-center gap-2">
                <GripVertical className="text-gray-400" size={16} />
                {idx + 1}.
              </td>
              <td className="px-3 py-2 border-b">{param.name}</td>
              <td className="px-3 py-2 border-b">
                {param.isOptional ? "Yes" : "No"}
              </td>
              <td className="px-3 py-2 border-b">{param.unit || "-"}</td>
              <td className="px-3 py-2 border-b">
                <button
                  onClick={() => navigate(`/admin/test-values/${test._id}`)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit3 size={14} />
                  Edit normal values
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <Loader />;
  if (!test) return <div>No test found</div>;

  return (
    <div className="p-6 bg-[#F1F5F9] h-full rounded-md space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black">{test.name}</h1>

        {/* ➕ Add / ✏️ Edit Formula Button */}
        {!branchToken && test.isFormula === true && (
  <button
    onClick={() => setShowFormulaModal(true)}
    className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
  >
    {existingFormula ? <Edit size={16} /> : <Plus size={16} />}
    {existingFormula ? "Edit Formula" : "Add Formula"}
  </button>
)}

      </div>

      {/* Single Test */}
      {test.type === "single" && (
        <div className="space-y-2">
          <p>
            Unit: <strong>{test.unit}</strong>
          </p>
          <button
            onClick={() => navigate(`/admin/test-values/${test._id}`)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
          >
            <Edit3 size={14} />
            Edit normal values
          </button>
        </div>
      )}

      {/* Multi Test */}
      {test.type === "multi" && (
        <div className="mt-4">{renderParameters(test.parameters || [])}</div>
      )}

      {/* ⚙️ Formula Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[500px] p-6 relative">
            <button
              onClick={() => setShowFormulaModal(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-600"
            >
              ✖
            </button>

            <h2 className="text-lg font-semibold mb-4 text-center">
              {existingFormula ? "Edit Formula" : "Add Formula"}
            </h2>

            {/* Dependent Tests */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Dependent Tests
              </label>
              <Select
                isMulti
                options={testOptions}
                value={formulaData.dependentTests}
                onChange={(selected) =>
                  setFormulaData((prev) => ({
                    ...prev,
                    dependentTests: selected,
                  }))
                }
                placeholder="Search and select dependent tests..."
                classNamePrefix="react-select"
              />
              <p className="text-xs text-gray-500 mt-1">
                Select tests whose results are used in this formula.
              </p>
            </div>

            {/* Formula Expression */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
  Formula Expression <span className="text-gray-500">(type names exactly as in dependencies)</span>
</label>

              <input
                type="text"
                className="w-full border border-gray-300 rounded-md p-2"
                placeholder="Example: (HDL + LDL + VLDL)"
                value={formulaData.expression}
                onChange={(e) =>
                  setFormulaData((prev) => ({
                    ...prev,
                    expression: e.target.value,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFormula}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Save Formula
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestView;
