


import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

// 🔹 Convert age to years
const ageToYears = (age, unit) => {
  switch (unit) {
    case "Days": return age / 365;
    case "Months": return age / 12;
    default: return age;
  }
};

// 🔹 Match reference range based on age & sex
const getMatchingReference = (param, age, ageUnit, sex) => {
  const ageInYears = ageToYears(age, ageUnit);
  const min = ageToYears(param.minAge ?? 0, param.minUnit || "Years");
  const max = ageToYears(param.maxAge ?? 200, param.maxUnit || "Years");
  const sexMatch = param.sex === "Any" || param.sex === sex;
  return sexMatch && ageInYears >= min && ageInYears <= max;
};

// 🔹 Safely extract ID
const extractId = (item) => {
  if (!item) return null;
  if (typeof item === "string") return item;
  if (item._id) return item._id.toString();
  if (item.testId) return item.testId.toString();
  return null;
};

// 🔹 Fetch test along with matched reference ranges
// 🔹 Fetch test along with matched reference ranges
const fetchTestWithRefs = async (testId, reportData, branchToken) => {
  try {
    if (!testId) return null;

    // Fetch main test
    const testRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/test/database/test/${testId}`,
      { headers: { Authorization: `Bearer ${branchToken}` } }
    );
    if (!testRes.data.success) return null;
    const test = testRes.data.data;

    // Helper: fetch reference ranges for a test
    const fetchRefRanges = async (t) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/branch/reference-ranges/test/${t._id}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );
        return res.data?.data || [];
      } catch (err) {
        console.error(`Error fetching refs for ${t.name}:`, err);
        return [];
      }
    };

    // Process test parameters with references
    const processTest = (t, refRanges, reportData) => {
      const baseParams = t.parameters?.length
        ? t.parameters.map((param) => ({
            paramId: param._id || `${t._id}_${param.name}`,
            name: param.name,
            unit: param.unit || "",
            groupBy: param.groupBy || " ",
          }))
        : [
            {
              paramId: t._id,
              name: t.name,
              unit: t.unit || "",
              groupBy: " ",
            },
          ];

      return baseParams.map((param) => {
        // --- First try to match specific parameter ---
        let ref = refRanges.find((r) => {
          if (r.which === "Text") {
            return r.parameterName === param.name; // ignore age/sex for text
          } else {
            return (
              r.parameterName === param.name &&
              getMatchingReference(
                r,
                reportData.patient.age,
                reportData.patient.ageUnit || "Years",
                reportData.patient.sex
              )
            );
          }
        });

        // --- Fallback to generic single-parameter reference ---
        if (!ref) {
          ref = refRanges.find((r) => {
            if (r.which === "Text") return r.parameterName === null;
            return (
              r.parameterName === null &&
              getMatchingReference(
                r,
                reportData.patient.age,
                reportData.patient.ageUnit || "Years",
                reportData.patient.sex
              )
            );
          });
        }

        // --- Determine reference value ---
        let referenceValue = "-";
        if (ref) {
          referenceValue =
            ref.which === "Text"
              ? ref.textValue || ref.displayText || "-"
              : ref.lower != null && ref.upper != null
              ? `${ref.lower} - ${ref.upper}`
              : ref.lower != null
              ? `> ${ref.lower}`
              : ref.upper != null
              ? `< ${ref.upper}`
              : "-";
        }

        return {
          paramId: param.paramId,
          name: param.name,
          unit: param.unit,
          groupBy: param.groupBy,
          which: ref?.which || "Numeric",
          reference: referenceValue,
        };
      });
    };

    // --- Handle single test or child tests ---
    let allTests = [];
    if (test.tests?.length) {
      for (const child of test.tests) {
        const childId = extractId(child);
        if (!childId) continue;

        const childRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/test/${childId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );

        if (childRes.data.success) {
          const t = childRes.data.data;
          const refs = await fetchRefRanges(t);
          const params = processTest(t, refs, reportData); // ✅ pass reportData
          allTests.push({
            testName: t.name,
            category: t.category || test.category || "Other",
            interpretation: t.interpretation || "",
            params,
          });
        }
      }
    } else {
      const refs = await fetchRefRanges(test);
      const params = processTest(test, refs, reportData); // ✅ pass reportData
      allTests.push({
        testName: test.name,
        category: test.category || "Other",
        interpretation: test.interpretation || "",
        params,
      });
    }

    return allTests;
  } catch (err) {
    console.error("Error fetching test:", err);
    return null;
  }
};



const EnterResults = () => {
  const { branchId, branchToken, errorToast, successToast } = useContext(LabContext);
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [testsByCategory, setTestsByCategory] = useState({});
  const [results, setResults] = useState({});
  const [references, setReferences] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/branch/${reportId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );

        if (!res.data.success) {
          errorToast(res.data.message || "Failed to fetch report");
          return;
        }

        const reportData = res.data.data;
        setReport(reportData);

        const allIds = [
          ...(reportData.tests?.LAB || []),
          ...(reportData.tests?.PANELS || []),
          ...(reportData.tests?.PACKAGES || []),
        ];

        const fetchedItems = await Promise.all(
          allIds.map(async (id) => {
            const safeId = extractId(id);
            if (!safeId) return null;

            // Try as TEST
            const test = await fetchTestWithRefs(safeId, reportData, branchToken);
            if (test) return { type: "TEST", data: test };

            // Try as PANEL
            try {
              const panelRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/panels/panel/${safeId}`,
                { headers: { Authorization: `Bearer ${branchToken}` } }
              );
              if (panelRes.data.success && panelRes.data.data) return { type: "PANEL", data: panelRes.data.data };
            } catch {}

            // Try as PACKAGE
            try {
              const pkgRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/packages/branch/package/${safeId}`,
                { headers: { Authorization: `Bearer ${branchToken}` } }
              );
              if (pkgRes.data.success && pkgRes.data.data) return { type: "PACKAGE", data: pkgRes.data.data };
            } catch {}

            return null;
          })
        );

        const validItems = fetchedItems.filter(Boolean);
        const categories = {};
        const initialResults = {};
        const initialReferences = {};

        const processParams = (params) => {
          if (!Array.isArray(params)) return;
          params.forEach((p) => {
            initialResults[p.paramId] = "";
            initialReferences[p.paramId] = p.reference || "";
          });
        };

        const traverseTests = (tests) => {
          tests.forEach((t) => {
            if (t.isPanel || t.isPackage) traverseTests(t.tests || []);
            else processParams(t.params);
          });
        };

        for (let item of validItems) {
          if (item.type === "TEST") {
            const testDataArray = Array.isArray(item.data) ? item.data : [item.data];
            testDataArray.forEach((testObj) => {
              const category = testObj.category || "Other";
              if (!categories[category]) categories[category] = [];
              if (Array.isArray(testObj.params)) processParams(testObj.params);
              if (testObj.params?.length > 0) categories[category].push(testObj);
            });
          }

          if (item.type === "PANEL") {
  const panel = item.data;
  const panelObj = {
    panelName: panel.name,
    isPanel: true,
    interpretation: panel.interpretation || "", // ✅ ADD THIS
    tests: [],
  };

  for (let testItem of panel.tests || []) {
    const testId = extractId(testItem);
    const testObj = await fetchTestWithRefs(testId, reportData, branchToken);
    if (testObj) panelObj.tests.push(...testObj);
  }

  traverseTests(panelObj.tests);
  if (!categories["Panels"]) categories["Panels"] = [];
  categories["Panels"].push(panelObj);
}


          if (item.type === "PACKAGE") {
            const pkg = item.data;
            const packageObj = {
  packageName: pkg.name,
  isPackage: true,
  interpretation: pkg.interpretation || "", // ✅ ADD THIS
  tests: [],
};

            for (let testItem of pkg.tests || []) {
              const testId = extractId(testItem);
              const testObj = await fetchTestWithRefs(testId, reportData, branchToken);
              if (testObj) packageObj.tests.push(...testObj);
            }
            for (let panelItem of pkg.panels || []) {
              const panelId = extractId(panelItem);
              if (!panelId) continue;
              try {
                const panelRes = await axios.get(
                  `${import.meta.env.VITE_API_URL}/api/test/panels/panel/${panelId}`,
                  { headers: { Authorization: `Bearer ${branchToken}` } }
                );
                if (!panelRes.data.success || !panelRes.data.data) continue;
                const panel = panelRes.data.data;
                const panelObj = { panelName: panel.name, isPanel: true, tests: [] };
                for (let testItem of panel.tests || []) {
                  const testId = extractId(testItem);
                  const testObj = await fetchTestWithRefs(testId, reportData, branchToken);
                  if (testObj) panelObj.tests.push(...testObj);
                }
                packageObj.tests.push(panelObj);
              } catch (err) { console.error(err); }
            }
            traverseTests(packageObj.tests);
            if (!categories["Packages"]) categories["Packages"] = [];
            categories["Packages"].push(packageObj);
          }
        }

        setTestsByCategory(categories);
        setResults(initialResults);
        setReferences(initialReferences);
        
        

      } catch (err) {
        console.error(err);
        errorToast(err.response?.data?.message || "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  const handleChange = (paramId, value) =>
    setResults((prev) => ({ ...prev, [paramId]: value }));

  const handleReferenceChange = (paramId, value) =>
    setReferences((prev) => ({ ...prev, [paramId]: value }));
const handleSubmit = async () => {
    if (!report) {
      errorToast("Patient details not found");
      return;
    }

    try {
      setLoading(true);

      const transformItem = (item) => {
        if (item.isPanel || item.isPackage) {
          return {
            panelOrPackageName: item.panelName || item.packageName,
            isPanel: item.isPanel || false,
            isPackage: item.isPackage || false,
            interpretation: item.interpretation || "",
            tests: (item.tests || []).map(transformItem),
          };
        } else {
          return {
            testName: item.testName,
            interpretation: item.interpretation || "",
            category: item.category || "Other",
            params: (item.params || []).map((p) => ({
              paramId: p.paramId,
              name: p.name,
              unit: p.unit,
              groupBy: p.groupBy || "Ungrouped",
              value: results[p.paramId] || "",
              reference: references[p.paramId] || p.reference || "",
            })),
          };
        }
      };

      const payload = {
        reportId,
        branchId,
        patient: {
          firstName: report.patient.firstName,
          lastName: report.patient.lastName,
          age: report.patient.age,
          ageUnit: report.patient.ageUnit || "Years",
          sex: report.patient.sex,
          doctor: report.patient.doctor || "",
          uhid: report.patient.uhid || "",
          regNo: report.regNo || "",
        },
        categories: Object.entries(testsByCategory || {}).map(([categoryName, items = []]) => ({
          categoryName,
          items: items.map(transformItem),
        })),
      };

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/results/add`,
        payload,
        { headers: { Authorization: `Bearer ${branchToken}` } }
      );

      if (res.data.success) {
        successToast("Report Generated Successfully");
        navigate(`/${branchId}/view-report/${reportId}`);
      } else {
        errorToast(res.data.message || "Failed to save results");
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
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

      {/* Tests / Panels / Packages */}
      {Object.keys(testsByCategory).map((category) => (
        <div key={category} className="mb-10 border rounded-lg bg-white shadow-sm">
          <div className="border-b bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700">
            ✶ {category.toUpperCase()}
          </div>

          {testsByCategory[category].map((item, idx) =>
            !item.isPanel && !item.isPackage ? (
              <TestRow key={item.testName || idx} item={item} results={results} references={references} handleChange={handleChange} handleReferenceChange={handleReferenceChange} />
            ) : (
              <PanelOrPackageRow key={item.panelName || item.packageName || idx} item={item} results={results} references={references} handleChange={handleChange} handleReferenceChange={handleReferenceChange} />
            )
          )}
        </div>
      ))}

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md shadow-sm transition"
        >
          Save & Generate Report
        </button>
      </div>
    </div>
  );
};

// 🔹 Component to render simple test
const TestRow = ({ item, results, references, handleChange, handleReferenceChange }) => {
  const params = Array.isArray(item.params) ? item.params : [];
  const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

  return (
    <div className="mt-4 px-6">
      {params.length > 1 && <div className="font-semibold text-gray-800 mb-2">✶ {item.testName}</div>}
      {groups.map((group) => (
        <div key={group} className="mb-4">
          {group && <div className="font-semibold text-gray-700 mb-1 ml-7">{group}</div>}
          <table className="w-full text-sm border-t border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-2 py-1 w-[40%]">Test</th>
                <th className="text-left px-2 py-1 w-[20%]">Value</th>
                <th className="text-left px-2 py-1 w-[20%]">Unit</th>
                <th className="text-left px-2 py-1 w-[20%]">Reference</th>
              </tr>
            </thead>
            <tbody>
              {params.filter((p) => (p.groupBy || "Ungrouped") === group).map((param) => (
                <tr key={param.paramId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-800">{param.name}</td>
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
                      onChange={(e) => handleReferenceChange(param.paramId, e.target.value)}
                      disabled
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
      ))}
    </div>
  );
};

// 🔹 Component to render panel or package with nested tests
const PanelOrPackageRow = ({ item, results, references, handleChange, handleReferenceChange }) => (
  <div className="mt-6 px-6">
    <div className="text-center bg-gray-200 px-3 py-2 font-semibold text-gray-700 mb-1">
       {item.panelName || item.packageName}
    </div>

    {Array.isArray(item.tests) &&
      item.tests.map((test, index) =>
        test.isPanel || test.isPackage ? (
          <PanelOrPackageRow
            key={test.panelName || test.packageName || index}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
            handleReferenceChange={handleReferenceChange}
          />
        ) : (
          <TestRow
            key={test.testName || index}
            item={test}
            results={results}
            references={references}
            handleChange={handleChange}
            handleReferenceChange={handleReferenceChange}
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
export default EnterResults;

