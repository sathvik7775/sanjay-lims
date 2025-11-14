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
  const [resultStructure, setResultStructure] = useState([]); // ✅ stores fetched structure

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

        const initialResults = {};
        const initialReferences = {};
        const collectedTests = [];

        // ✅ Save full structure for resubmission
        if (resultData && Array.isArray(resultData.categories)) {
  setResultStructure(resultData.categories);

  resultData.categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {

      // 🔹 CASE 1: Panel → has tests[]
      if (Array.isArray(item.tests) && item.tests.length > 0) {
        item.tests.forEach((test) => {
          collectedTests.push(test);

          (test.params || []).forEach((p) => {
            initialResults[p.paramId] = p.value || "";
            initialReferences[p.paramId] = p.reference || "";
          });
        });
      }

      // 🔹 CASE 2: Normal test → params[] directly inside items
      else {
        collectedTests.push(item);

        (item.params || []).forEach((p) => {
          initialResults[p.paramId] = p.value || "";
          initialReferences[p.paramId] = p.reference || "";
        });
      }

    });
  });
}


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

  /* ----------------------------- 🔹 Input Handler ----------------------------- */
  

const handleChange = async (paramId, value) => {
  const updated = { ...results, [paramId]: value };
  setResults(updated);

  // 🔹 Loop through all tests that have formulas
  for (const test of allTests) {
    const formulaParam = test.params?.find((p) => p.isFormula);
    if (!formulaParam) continue;

    // fetch formula and dependencies if not loaded yet
    if (!formulaParam.formulaString || !Array.isArray(formulaParam.dependencies)) {
      try {
        const { formulaString, dependencies } = await fetchFormula(formulaParam.paramId);
        formulaParam.formulaString = formulaString;
        formulaParam.dependencies = dependencies;
      } catch (err) {
        console.error("❌ Formula fetch error:", err);
        continue;
      }
    }

    if (!formulaParam.formulaString || !formulaParam.dependencies?.length) continue;

    // only calculate when all dependency values are available
    const allDepsFilled = formulaParam.dependencies.every(
      (dep) => updated[dep.paramId] !== undefined && updated[dep.paramId] !== ""
    );

    if (allDepsFilled) {
      try {
        const resultValue = calculateFormulaResult(
          formulaParam.formulaString,
          formulaParam.dependencies,
          updated
        );

        if (!isNaN(resultValue)) {
          updated[formulaParam.paramId] = Number(resultValue.toFixed(2));
        }
      } catch (err) {
        console.error("⚠️ Formula calc error:", err);
      }
    }
  }

  setResults({ ...updated });
};


  /* ----------------------------- 🔹 Submit ----------------------------- */
  const handleSubmit = async (status) => {
    if (!report) return errorToast("Patient details missing");

    try {
      setLoading(true);

      // 🧩 Build categories from previously fetched resultStructure
      const categories = resultStructure.map((cat) => ({
        categoryName: cat.categoryName,
        items: (cat.items || []).map((item) => ({
          panelOrPackageName: item.panelOrPackageName || "",
          isPanel: item.isPanel || false,
          isPackage: item.isPackage || false,
          interpretation: item.interpretation || "",
          tests: (item.tests || []).map((test) => ({
            testName: test.testName,
            interpretation: test.interpretation || "",
            category: test.category || cat.categoryName,
            params: (test.params || []).map((p) => ({
              paramId: p.paramId,
              name: p.name,
              unit: p.unit,
              groupBy: p.groupBy || "Ungrouped",
              value: results[p.paramId] ?? p.value ?? "",
              reference: references[p.paramId] ?? p.reference ?? "",
            })),
          })),
        })),
      }));

      const payload = {
        reportId,
        status,
        patient: { ...report.patient, regNo: report.regNo },
        categories,
      };

      console.log("🧾 Payload being sent to backend:", payload);

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
      console.error("❌ Error updating result:", err);
      errorToast(err.response?.data?.message || "Server error");
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- 🔹 UI ----------------------------- */
  if (loading) return <Loader />;
  if (!report) return <p className="p-6 text-gray-500">Report not found</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

  {/* Header */}
  <PatientHeader report={report} />

  {/* Group tests by category */}
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

      {tests.map((test, iIdx) =>
        test.isPanel || test.isPackage ? (
          <PanelOrPackageRow
            key={iIdx}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
            
          />
        ) : (
          <TestRow
            key={iIdx}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
            
          />
        )
      )}
    </div>
  ))}

  {/* Buttons */}
  <div className="mt-6 flex gap-4">
    <button
      onClick={() => handleSubmit("In Progress")}
      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md shadow-sm transition"
    >
      Save Only
    </button>

    <button
      onClick={() => handleSubmit("Signed Off")}
      className="bg-primary-dark hover:bg-primary text-white px-6 py-2 rounded-md shadow-sm transition"
    >
      Sign Off
    </button>

    <button
      onClick={() => handleSubmit("Final")}
      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md shadow-sm transition"
    >
      Final
    </button>
  </div>

</div>
  );
};

const PatientHeader = ({ report }) => (
  <div className="border rounded-lg bg-white shadow-sm p-4 mb-6">
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
      <p><strong>Patient Name:</strong> {report.patient.firstName} {report.patient.lastName}</p>
      <p><strong>Age / Sex:</strong> {report.patient.age} {report.patient.ageUnit || "Years"} / {report.patient.sex}</p>
      <p><strong>Referred By:</strong> {report.patient.doctor || "—"}</p>
      <p><strong>Date:</strong> {new Date(report.createdAt).toLocaleDateString()}</p>
      <p><strong>PAT. ID:</strong> {report.regNo}</p>
      <p><strong>UHID:</strong> {report.patient.uhid}</p>
    </div>
  </div>
);


const TestRow = ({ item, results, references, handleChange,  }) => {
  const params = Array.isArray(item.params) ? item.params : [];
  const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

  const isDLC = item.testName?.trim().toLowerCase() === "differential leucocyte count";

  let dlcTotal = 0;
  if (isDLC) {
    dlcTotal = params.reduce((sum, p) => {
      const val = parseFloat(results[p.paramId] || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }

  const checkRange = (value, reference) => {
    if (!value || !reference) return null;

    const match = reference.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!match) return null;

    const [, min, max] = match;
    const numVal = parseFloat(value);

    if (numVal < parseFloat(min)) return { type: "low", min, max };
    if (numVal > parseFloat(max)) return { type: "high", min, max };
    return null;
  };

  return (
    <div className="mt-4 px-6">

      {params.length > 1 && (
        <div className="font-semibold text-gray-800 mb-2">
          ✶ {item.testName}
        </div>
      )}

      {groups.map((group) => (
        <div key={group} className="mb-4">
          {group && <div className="font-semibold text-gray-700 ml-7 mb-1">{group}</div>}

          <table className="w-full text-sm border-t border-gray-300 table-fixed">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left w-[40%]">Test</th>
                <th className="px-2 py-1 text-left w-[20%]">Value</th>
                <th className="px-2 py-1 text-left w-[20%]">Unit</th>
                <th className="px-2 py-1 text-left w-[20%]">Reference</th>
              </tr>
            </thead>

            <tbody>
              {params
                .filter((p) => (p.groupBy || "Ungrouped") === group)
                .map((param) => {
                  const value = results[param.paramId] || "";
                  const reference = references[param.paramId] || "";
                  const out = checkRange(value, reference);

                  return (
                    <tr key={param.paramId} className="border-t">
                      <td className="px-4 py-2 w-[40%] flex items-center gap-2">
                        {out && (
                          <span className="text-red-600 font-bold text-xs">
                            {out.type === "high" ? "H ↑" : "L ↓"}
                          </span>
                        )}
                        {param.name}
                      </td>

                      <td className="px-3 py-2 relative">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleChange(param.paramId, e.target.value)
                          }
                          className={`w-full border rounded px-2 py-1 ${
                            out ? "border-red-500 text-red-600 font-bold" : "border-gray-300"
                          }`}
                        />

                        {out && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 group cursor-pointer">
                            <span className="text-red-600 font-bold">⚠</span>
                            <div className="hidden group-hover:block absolute right-6 top-1/2 -translate-y-1/2 bg-white border border-red-700 text-red-500 text-xs p-2 rounded shadow-lg w-48">
                              {out.type === "high"
                                ? `${value} is higher than ${out.max}`
                                : `${value} is lower than ${out.min}`}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2 text-gray-600">{param.unit}</td>

                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={reference}
                          disabled
                          className="w-full border border-gray-300 bg-gray-100 rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {isDLC && (
            <div className="mt-2 text-sm font-semibold">
              Total:{" "}
              <span className={dlcTotal === 100 ? "text-green-600" : "text-red-600"}>
                {dlcTotal}
              </span>
            </div>
          )}

          {item.interpretation && (
            <div className="mt-3">
              <div className="font-semibold text-gray-800 text-sm">Interpretation:</div>
              <div
                className="text-gray-700 text-sm ml-4"
                dangerouslySetInnerHTML={{ __html: item.interpretation }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};


const PanelOrPackageRow = ({ item, results, references, handleChange }) => (
  <div className="mt-6 px-6">
    <div className="text-center bg-gray-200 px-3 py-2 font-semibold text-gray-700 mb-1">
      {item.panelName || item.packageName}
    </div>

    {item.tests?.map((test, idx) =>
      test.isPanel || test.isPackage ? (
        <PanelOrPackageRow
          key={idx}
          item={test}
          results={results}
          references={references}
          handleChange={handleChange}
          
        />
      ) : (
        <TestRow
          key={idx}
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
