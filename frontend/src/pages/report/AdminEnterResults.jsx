




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

// 🔹 Fetch formula for the test
const fetchFormula = async (testId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/formula/${testId}`);

    // Log the full response to understand its structure
    console.log("fetchFormula response:", response);

    if (response.data && response.data.data) {
      const { formulaString, dependencies } = response.data.data;
      console.log("Formula String:", formulaString);
      console.log("Dependencies:", dependencies);

      // If dependencies is not present, return an empty array to avoid errors
      if (!dependencies) {
        console.warn("Dependencies not found for formula");
        return { formulaString: '', dependencies: [] };
      }

      return { formulaString, dependencies };
    } else {
      console.warn("No formula data found.");
      return { formulaString: '', dependencies: [] };
    }
  } catch (error) {
    console.error("Error fetching formula:", error);
    return { formulaString: '', dependencies: [] }; // Return default values if error occurs
  }
};


// 🔹 Formula calculation — fixed
const calculateFormulaResult = (formula, dependencies, results) => {
  try {
    let calculatedFormula = formula;

    console.log("🔢 Raw Formula:", formula);
    console.log("🧩 Dependencies:", dependencies);
    console.log("📊 Current Results (by name):", results);

    // Sort dependencies by name length (longest first)
    // 👉 avoids partial replacements like "HDL" inside "HDL Cholesterol"
    const sortedDeps = [...dependencies].sort(
      (a, b) => b.testName.length - a.testName.length
    );

    sortedDeps.forEach((dep) => {
      const depName = dep.testName?.trim();
      const value = parseFloat(results[depName]);
      const safeValue = isNaN(value) ? 0 : value;

      console.log(`🔗 Replacing ${depName} with value: ${safeValue}`);

      // Escape special regex characters in the test name
      const safeDepName = depName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Replace all occurrences (case-insensitive)
      const regex = new RegExp(`\\b${safeDepName}\\b`, "gi");
      calculatedFormula = calculatedFormula.replace(regex, safeValue);
    });

    console.log("🧮 Formula after replacement:", calculatedFormula);

    // Evaluate safely
    const result = Function(`"use strict"; return (${calculatedFormula});`)();

    console.log("✅ Calculated result:", result);
    return result;
  } catch (err) {
    console.error("❌ Error evaluating formula:", err);
    return null;
  }
};








// 🔹 Fetch test along with matched reference ranges
const fetchTestWithRefs = async (testId, reportData, adminToken) => {
  try {
    if (!testId) return null;

    // Fetch main test
    const testRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${testId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    if (!testRes.data.success) return null;
    const test = testRes.data.data;

    // Helper: fetch reference ranges for a test
    const fetchRefRanges = async (t) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/reference-ranges/test/${t._id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
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

    let allTests = [];
    if (test.tests?.length) {
      for (const child of test.tests) {
        const childId = extractId(child);
        if (!childId) continue;

        const childRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${childId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
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
            isFormula: t.isFormula || false, // Add this for formula check
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
        isFormula: test.isFormula || false, // Add this for formula check
      });
    }

    // ✅ Attach formula details if applicable
    if (test.isFormula && test._id) {
      console.log("🔍 Checking test:", test.name, "isFormula:", test.isFormula);
      const { formulaString, dependencies } = await fetchFormula(test._id);
      test.formulaString = formulaString;
      test.dependencies = dependencies;
    }




    return allTests;
  } catch (err) {
    console.error("Error fetching test:", err);
    return null;
  }
};


const AdminEnterResults = () => {
  const { branchToken, errorToast, successToast, adminToken } = useContext(LabContext);
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
          `${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
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
            const test = await fetchTestWithRefs(safeId, reportData, adminToken);
            if (test) return { type: "TEST", data: test };

            // Try as PANEL
            try {
              const panelRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${safeId}`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
              );
              if (panelRes.data.success && panelRes.data.data) return { type: "PANEL", data: panelRes.data.data };
            } catch { }

            // Try as PACKAGE
            try {
              const pkgRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
              );
              if (pkgRes.data.success && pkgRes.data.data) return { type: "PACKAGE", data: pkgRes.data.data };
            } catch { }

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
              const testObj = await fetchTestWithRefs(testId, reportData, adminToken);
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
              const testObj = await fetchTestWithRefs(testId, reportData, adminToken);
              if (testObj) packageObj.tests.push(...testObj);
            }

            for (let panelItem of pkg.panels || []) {
              const panelId = extractId(panelItem);
              if (!panelId) continue;
              try {
                const panelRes = await axios.get(
                  `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${panelId}`,
                  { headers: { Authorization: `Bearer ${adminToken}` } }
                );
                if (!panelRes.data.success || !panelRes.data.data) continue;
                const panel = panelRes.data.data;
                const panelObj = { panelName: panel.name, isPanel: true, tests: [] };
                for (let testItem of panel.tests || []) {
                  const testId = extractId(testItem);
                  const testObj = await fetchTestWithRefs(testId, reportData, adminToken);
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

        for (const category of Object.keys(categories)) {
  for (const test of categories[category]) {
    // 🧩 If the test itself is formula-based
    if (test.isFormula) {
      const formulaId = test.params?.[0]?.paramId || test._id;
      if (formulaId) {
        const { formulaString, dependencies } = await fetchFormula(formulaId);
        test.formulaString = formulaString;
        test.dependencies = dependencies;
      }
    }

    // 🧩 If it has nested panels/packages, handle inner tests too
    if (test.isPanel || test.isPackage) {
      for (const innerTest of test.tests || []) {
        if (innerTest.isFormula) {
          const formulaId = innerTest.params?.[0]?.paramId || innerTest._id;
          if (formulaId) {
            const { formulaString, dependencies } = await fetchFormula(formulaId);
            innerTest.formulaString = formulaString;
            innerTest.dependencies = dependencies;
          }
        }
      }
    }
  }
}

        setTestsByCategory(categories);
        setResults(initialResults);
        setReferences(initialReferences);

        // 🔹 Fetch and attach formula data after tests are loaded
        for (const category of Object.keys(categories)) {
          for (const test of categories[category]) {
            if (test.isFormula && test.testName) {
              const { formulaString, dependencies } = await fetchFormula(test.params?.[0]?.paramId || test._id);
              test.formulaString = formulaString;
              test.dependencies = dependencies;
            }
          }
        }
        setTestsByCategory({ ...categories });

      } catch (err) {
        console.error(err);
        errorToast(err.response?.data?.message || "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);




  const handleChange = async (testName, value) => {
  console.log(`⚡ handleChange triggered for: ${testName} = ${value}`);

  // ✅ Immediate UI update for smoother typing
  setResults((prev) => ({ ...prev, [testName.trim()]: value }));

  // ✅ Prepare updated results snapshot
  const cleanName = testName.trim();
  const updatedResults = { ...results, [cleanName]: value };

  // ✅ Flatten all tests
  const allTests =
    testsByCategory?.Panels?.flatMap((p) => p.tests || []) || [];

  console.log("🧩 Extracted all tests:", allTests.map((t) => t.testName));
  console.log("📂 Tests by category:", testsByCategory);

  for (const test of allTests) {
    console.log("🧠 Checking test:", test.testName, "→ isFormula:", test.isFormula);
    console.log("🧩 Full test object:", test);

    if (!test.isFormula) continue;

    // ✅ Fetch formula if missing
    if (!test.formulaString || !Array.isArray(test.dependencies)) {
      try {
        const paramId = test.params?.[0]?.paramId;
        if (paramId) {
          console.log(`📡 Fetching formula for ${test.testName}...`);
          const { formulaString, dependencies } = await fetchFormula(paramId);
          test.formulaString = formulaString;
          test.dependencies = dependencies;
          console.log(`✅ Formula fetched for ${test.testName}:`, formulaString);
        }
      } catch (err) {
        console.error(`❌ Failed to fetch formula for ${test.testName}:`, err);
        continue;
      }
    }

    // ✅ Skip if still missing formula data
    if (
      !test.formulaString ||
      !Array.isArray(test.dependencies) ||
      test.dependencies.length === 0
    ) {
      console.log(`⚠️ Skipping ${test.testName}, missing formula/dependencies`);
      continue;
    }

    console.log(
      `🧪 Formula test detected: ${test.testName}`,
      "\nFormula String:", test.formulaString,
      "\nDependencies:", test.dependencies.map((d) => d.testName)
    );

    // ✅ Check if all dependencies have values
    const allDepsPresent = test.dependencies.every((dep) => {
      const depName = dep.testName?.trim();
      const hasValue =
        updatedResults[depName] !== undefined &&
        updatedResults[depName] !== "";
      if (!hasValue) console.log(`⚠️ Missing value for dependency: ${depName}`);
      return hasValue;
    });

    // ✅ Calculate if dependencies are ready
    if (allDepsPresent) {
      console.log(`🧮 All dependencies present for: ${test.testName}`);
      try {
        const result = calculateFormulaResult(
          test.formulaString,
          test.dependencies,
          updatedResults
        );

        if (result !== null && !isNaN(result)) {
          const formulaName = test.testName.trim();
          updatedResults[formulaName] = Number(result.toFixed(2));
          console.log(`✅ Auto-calculated ${formulaName}: ${result}`);
        } else {
          console.log(`⚠️ Invalid numeric result for ${test.testName}`);
        }
      } catch (err) {
        console.error(`❌ Error calculating formula for ${test.testName}:`, err);
      }
    }
  }

  // ✅ 🧹 Clean results — remove numeric or Mongo-like paramIds
  const cleanedResults = {};
  Object.keys(updatedResults).forEach((key) => {
    // keep only test names (non-numeric)
    // 🧹 Keep only keys that look like readable test names (not Mongo IDs)
if (!/^[0-9a-f]{24}$/i.test(key)) {
  cleanedResults[key] = updatedResults[key];
}

  });

  // ✅ Finally, update results state
  setResults(cleanedResults);

  console.log("🧾 Cleaned results:", cleanedResults);
};










  // 🧮 Auto-calculate formulas whenever results change
  useEffect(() => {
    if (!testsByCategory || Object.keys(results).length === 0) return;

    const allTests = Object.values(testsByCategory).flat();

    allTests.forEach((test) => {
      if (test.isFormula && test.formulaString && test.dependencies?.length > 0) {
        const allDepsFilled = test.dependencies.every((dep) => {
          const depId = dep.testId?._id;
          const value = results[depId];
          return value !== undefined && value !== "";
        });

        if (allDepsFilled) {
          const result = calculateFormulaResult(
            test.formulaString,
            test.dependencies,
            results
          );

          const formulaParam = test.params?.[0]?.paramId;
          if (formulaParam && result !== null) {
            setResults((prev) => ({
              ...prev,
              [formulaParam]: result.toFixed(2),
            }));
          }
        }
      }
    });
  }, [results, testsByCategory]);






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
          params: (item.params || []).map((p) => {
            // Find the entered value using either test name or paramId
            const valueFromName = results[p.name];
            const valueFromId = results[p.paramId];

            return {
              paramId: p.paramId,
              name: p.name,
              unit: p.unit,
              groupBy: p.groupBy || "Ungrouped",

              // ✅ Only store the numeric/text value (no key name)
              value: valueFromName || valueFromId || "",

              reference: references[p.paramId] || p.reference || "",
            };
          }),
        };
      }
    };

    const payload = {
      reportId,
      
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

    console.log("🧾 Final payload being sent:", payload);

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/api/results/admin/add`,
      payload,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (res.data.success) {
      successToast("Report Generated Successfully");
      navigate(`/admin/view-report/${reportId}`);
    } else {
      errorToast(res.data.message || "Failed to save results");
    }
  } catch (err) {
    console.error("❌ Error saving report:", err);
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
                  <td className="px-4 py-2 text-gray-800">
  <div className="flex items-center gap-2">
    <span>{param.name}</span>

    {/* 🔹 Formula icon beside param name — but comes from item */}
    {item.isFormula && item.formulaString && (
      <div className="relative group inline-flex items-center">
        <span className="text-blue-600 font-bold cursor-pointer border border-blue-500 px-1 rounded text-xs flex items-center justify-center">
          ƒ
        </span>

        {/* Tooltip from test-level formula */}
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-10 shadow-lg">
          Formula: {item.formulaString}
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
        </div>
      </div>
    )}
  </div>
</td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={results[param.name] || ""} // ✅ use param.name as key for both display & update
                      onChange={(e) => handleChange(param.name, e.target.value)} // ✅ pass test name instead of paramId
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

          {/* Display the calculated result */}
          {item.isFormula && item.calculatedResult && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Calculated Result: </strong> {item.calculatedResult}
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

export default AdminEnterResults;


