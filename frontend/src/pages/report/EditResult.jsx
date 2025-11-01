import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

/* ----------------------------- 🔹 Formula Logic ----------------------------- */

const fetchFormula = async (testId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/formula/${testId}`);
    if (response.data?.data) {
      const { formulaString, dependencies } = response.data.data;
      return { formulaString, dependencies: dependencies || [] };
    }
    return { formulaString: "", dependencies: [] };
  } catch (error) {
    console.error("Error fetching formula:", error);
    return { formulaString: "", dependencies: [] };
  }
};

const calculateFormulaResult = (formula, dependencies, results) => {
  try {
    let calculated = formula;

    const sortedDeps = [...dependencies].sort((a, b) => b.testName.length - a.testName.length);
    sortedDeps.forEach((dep) => {
      const depName = dep.testName?.trim();
      const value = parseFloat(results[depName]);
      const safeValue = isNaN(value) ? 0 : value;
      const safeDepName = depName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${safeDepName}\\b`, "gi");
      calculated = calculated.replace(regex, safeValue);
    });

    const result = Function(`"use strict"; return (${calculated});`)();
    return result;
  } catch (err) {
    console.error("❌ Formula error:", err);
    return null;
  }
};

/* ----------------------------- 🔹 EditResult ----------------------------- */

const EditResult = () => {
  const { branchId, branchToken, errorToast, successToast } = useContext(LabContext);
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [results, setResults] = useState({});
  const [references, setReferences] = useState({});
  const [allTests, setAllTests] = useState([]);

  /* ----------------------------- 🔹 Fetch Report ----------------------------- */
  useEffect(() => {
  const fetchReportData = async () => {
    try {
      setLoading(true);

      const [reportRes, resultRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/cases/branch/${reportId}`, {
          headers: { Authorization: `Bearer ${branchToken}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/results/report/${reportId}`, {
          headers: { Authorization: `Bearer ${branchToken}` },
        }),
      ]);

      if (!reportRes.data.success) throw new Error("Failed to fetch report");

      const reportData = reportRes.data.data;
      const resultData = resultRes.data?.data || {};
      setReport(reportData);

      console.log("🧠 Report Data Structure:", reportData);
      console.log("🧠 Result Data Structure:", resultData);

      const initialResults = {};
      const initialReferences = {};
      const collectedTests = [];

      // ✅ Helper to add tests + params
      const addTests = (tests) => {
        if (!Array.isArray(tests)) return;
        tests.forEach((test) => {
          collectedTests.push(test);
          (test.params || []).forEach((p) => {
            const existing = findValueFromResult(resultData, p.paramId);
            initialResults[p.paramId] = existing ?? "";
            initialReferences[p.paramId] = p.reference || "";
          });
        });
      };

      // ✅ Handle reportData.tests[categoryName] structure
      // ✅ Build collectedTests based on resultData
if (resultData && Array.isArray(resultData.categories)) {
  resultData.categories.forEach((cat) => {
    if (Array.isArray(cat.items)) {
      cat.items.forEach((item) => {
        if (Array.isArray(item.tests)) {
          addTests(item.tests);
        }
      });
    }
  });
}


      console.log("✅ collectedTests before set:", collectedTests);
      console.log("✅ initialResults before set:", initialResults);
      console.log("✅ initialReferences before set:", initialReferences);

      setResults(initialResults);
      setReferences(initialReferences);
      setAllTests(collectedTests);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      errorToast(err.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  fetchReportData();
}, [reportId, branchToken]);



  useEffect(() => {
  console.log("✅ Updated Results:", results);
  console.log("✅ Updated All Tests:", allTests);
}, [results, allTests]);


  /* ----------------------------- 🔹 Find Value ----------------------------- */
  const findValueFromResult = (resultData, paramId) => {
    try {
      if (!resultData || !Array.isArray(resultData.categories)) return "";
      for (const category of resultData.categories) {
        for (const item of category.items || []) {
          for (const test of item.tests || []) {
            for (const param of test.params || []) {
              if (param.paramId === paramId) return param.value || "";
            }
          }
        }
      }
      return "";
    } catch (err) {
      console.error("❌ findValueFromResult error:", err);
      return "";
    }
  };

  /* ----------------------------- 🔹 Input Handler ----------------------------- */
  const handleChange = async (paramId, value) => {
    const updated = { ...results, [paramId]: value };
    setResults(updated);

    for (const test of allTests) {
      if (!test.isFormula) continue;

      if (!test.formulaString || !Array.isArray(test.dependencies)) {
        try {
          const formulaId = test.params?.[0]?.paramId;
          if (formulaId) {
            const { formulaString, dependencies } = await fetchFormula(formulaId);
            test.formulaString = formulaString;
            test.dependencies = dependencies;
          }
        } catch (err) {
          console.error("❌ Formula fetch error:", err);
          continue;
        }
      }

      if (!test.formulaString || !test.dependencies?.length) continue;

      const allDepsPresent = test.dependencies.every(
        (dep) => updated[dep.paramId] !== undefined && updated[dep.paramId] !== ""
      );

      if (allDepsPresent) {
        try {
          const result = calculateFormulaResult(test.formulaString, test.dependencies, updated);
          if (!isNaN(result)) {
            const formulaParamId = test.params?.[0]?.paramId;
            updated[formulaParamId] = Number(result.toFixed(2));
          }
        } catch (err) {
          console.error("⚠️ Formula calc error:", err);
        }
      }
    }

    setResults({ ...updated });
  };

  /* ----------------------------- 🔹 Submit ----------------------------- */
  const handleSubmit = async () => {
    if (!report) return errorToast("Patient details missing");

    try {
      setLoading(true);

      const payload = {
        reportId,
        patient: { ...report.patient, regNo: report.regNo },
        categories: (report.categories || []).map((cat) => ({
          categoryName: cat.categoryName,
          items: (cat.items || []).map((panel) => ({
            panelOrPackageName: panel.panelOrPackageName,
            isPanel: panel.isPanel || false,
            isPackage: panel.isPackage || false,
            interpretation: panel.interpretation || "",
            tests: (panel.tests || []).map((test) => ({
              testName: test.testName,
              interpretation: test.interpretation || "",
              category: test.category || cat.categoryName,
              params: (test.params || []).map((p) => ({
                paramId: p.paramId,
                unit: p.unit,
                groupBy: p.groupBy || "Ungrouped",
                value: results[p.paramId] || "",
                reference: references[p.paramId] || p.reference || "",
              })),
            })),
          })),
        })),
      };

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/results/update/${reportId}`,
        payload,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (res.data.success) {
        successToast("Report updated successfully");
        navigate(`/${branchId}/view-report/${reportId}`);
      } else {
        errorToast(res.data.message || "Failed to update");
      }
    } catch (err) {
      console.error(err);
      errorToast(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;
  if (!report) return <p className="p-6 text-gray-500">Report not found</p>;

  /* ----------------------------- 🔹 UI ----------------------------- */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="font-bold text-2xl mb-4">Edit Results</h1>

      <PatientHeader report={report} />

{Object.entries(
  allTests.reduce((acc, test) => {
    const category = test.category?.trim() || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(test);
    return acc;
  }, {})
).map(([categoryName, tests], cIdx) => (
  <div key={cIdx} className="mb-10 border rounded-lg bg-white shadow-sm">
    <div className="border-b bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700">
      ✶ {categoryName.toUpperCase()}
    </div>

    {tests.map((test, iIdx) => (
      <TestRow
        key={iIdx}
        item={test}
        results={results}
        references={references}
        handleChange={handleChange}
      />
    ))}
  </div>
))}


      {/* 🔹 Conditionally show Save button */}
      {branchToken && (
        <div className="text-center mt-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md shadow-sm transition"
          >
            Update Report
          </button>
        </div>
      )}
    </div>
  );
};

/* ----------------------------- 🔹 Patient Header ----------------------------- */
const PatientHeader = ({ report }) => (
  <div className="border rounded-lg bg-white shadow-sm p-4 mb-6">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
      <p><strong>Patient:</strong> {report.patient.firstName} {report.patient.lastName}</p>
      <p><strong>Age / Sex:</strong> {report.patient.age} {report.patient.ageUnit || "Years"} / {report.patient.sex}</p>
      <p><strong>Doctor:</strong> {report.patient.doctor || "—"}</p>
      <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
      <p><strong>Reg No:</strong> {report.regNo}</p>
      <p><strong>UHID:</strong> {report.patient.uhid}</p>
    </div>
  </div>
);

/* ----------------------------- 🔹 Test Table ----------------------------- */
const TestRow = ({ item, results, references, handleChange }) => {
  const params = Array.isArray(item.params) ? item.params : [];
  const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

  return (
    <div className="mt-4 px-6 border rounded-md pb-4">
      <div className="font-semibold text-gray-800 mb-2">
        ✶ {item.testName}
      </div>

      {groups.map((group) => (
        <div key={group} className="mb-4">
          {group && (
            <div className="font-semibold text-gray-700 mb-1 ml-7">
              {group}
            </div>
          )}

          <table className="w-full text-sm border-t border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1 w-[40%]">Parameter</th>
                <th className="text-left px-2 py-1 w-[20%]">Value</th>
                <th className="text-left px-2 py-1 w-[20%]">Unit</th>
                <th className="text-left px-2 py-1 w-[20%]">Reference</th>
              </tr>
            </thead>

            <tbody>
              {params
                .filter((p) => (p.groupBy || "Ungrouped") === group)
                .map((param) => (
                  <tr key={param.paramId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">
                      <div className="flex items-center gap-2">
                        <span>{param.name}</span>
                        {param.isFormula && param.formulaString && (
                          <div className="relative group inline-flex items-center">
                            <span className="text-blue-600 font-bold cursor-pointer border border-blue-500 px-1 rounded text-xs">
                              ƒ
                            </span>
                            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 shadow-lg">
                              Formula: {param.formulaString}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={results[param.paramId] || ""}
                        onChange={(e) => handleChange(param.paramId, e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-600">{param.unit}</td>
                    <td className="px-3 py-2 text-gray-600">
                      <input
                        type="text"
                        value={references[param.paramId] || ""}
                        disabled
                        className="w-full border border-gray-300 rounded px-2 py-1 bg-gray-100"
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

/* ----------------------------- 🔹 Panel/Package ----------------------------- */
const PanelOrPackageRow = ({ item, results, references, handleChange }) => (
  <div className="mt-6 px-6">
    <div className="text-center bg-gray-200 px-3 py-2 font-semibold text-gray-700 mb-3">
      {item.panelName || item.packageName || item.panelOrPackageName}
    </div>

    {Array.isArray(item.tests) &&
      item.tests.map((test, index) =>
        test.isPanel || test.isPackage ? (
          <PanelOrPackageRow
            key={index}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
          />
        ) : (
          <TestRow
            key={index}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
          />
        )
      )}

    {item.interpretation && (
      <div className="mt-3 mb-2 px-2">
        <div className="font-semibold text-gray-800 text-sm">Interpretation:</div>
        <div
          className="text-gray-700 text-sm mt-1 ml-4"
          dangerouslySetInnerHTML={{ __html: item.interpretation }}
        />
      </div>
    )}
  </div>
);

export default EditResult;
