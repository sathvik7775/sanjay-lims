import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";
import { TriangleAlert } from 'lucide-react'
import { useLocation } from "react-router-dom";



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

const normalize = (str) =>
  str
    ?.replace(/\u00A0/g, " ")     // replace NBSP
    .replace(/\s+/g, " ")         // collapse spaces
    .trim();

const calculateFormulaResult = (formula, dependencies, results) => {
  try {
    let calculated = formula;

    // STEP 0 — sort by longest name first (fixes the overlap problem)
    const sortedDeps = [...dependencies].sort((a, b) =>
      b.testName.length - a.testName.length
    );

    // STEP 1 — replace with placeholders
    sortedDeps.forEach((dep, i) => {
      const fullName = normalize(dep.testName);
      const shortName = dep.shortName?.trim();

      const ph = `__VAR${i}__`;

      const escapedFull = fullName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      calculated = calculated.replace(new RegExp(escapedFull, "gi"), ph);

      if (shortName) {
        const escapedShort = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        calculated = calculated.replace(new RegExp(escapedShort, "gi"), ph);
      }
    });

    console.log("STEP1:", calculated);

    // STEP 2 — replace placeholders with values
    sortedDeps.forEach((dep, i) => {
      const fullName = normalize(dep.testName);
      const shortName = dep.shortName?.trim();

      const fromFull = parseFloat(results[fullName]);
      const fromShort = shortName ? parseFloat(results[shortName]) : NaN;

      const value =
        !isNaN(fromFull) ? fromFull :
        !isNaN(fromShort) ? fromShort :
        0;

      calculated = calculated.replace(new RegExp(`__VAR${i}__`, "g"), value);
    });

    console.log("STEP2 FINAL STRING:", calculated);

    // STEP 3 — evaluate
    return Function(`"use strict"; return (${calculated});`)();

  } catch (err) {
    console.error("FORMULA ERR:", err);
    return null;
  }
};




/* ----------------------------- 🔹 EditResult ----------------------------- */

const AdminEditResult = () => {
  const { selectedBranch, branchToken, errorToast, successToast, adminToken } = useContext(LabContext);
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const query = new URLSearchParams(location.search);
const autoFinal = query.get("autoFinal");


  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [report, setReport] = useState(null);
  const [results, setResults] = useState({});
  const [references, setReferences] = useState({});
  const [testsByCategory, setTestsByCategory] = useState({});

  const [resultStructure, setResultStructure] = useState([]); // ✅ stores fetched structure


  const [branches, setBranches] = useState([]);
    const [labDetails, setLabDetails] = useState(null);
     const [branchId, setBranchId] = useState(null)


    useEffect(() => {
        setBranchId(selectedBranch)
      }, [])
      

    useEffect(() => {
  if (!loading && autoFinal === "true") {
    console.log("🔥 Auto-final triggered");

    setTimeout(() => {
      const btn = document.getElementById("finalSubmitButton");
      if (btn) btn.click();
    }, 300);
  }
}, [loading, autoFinal]);



    const fetchBranches = async () => {
    try {
      
      const res = await axios.get( `${import.meta.env.VITE_API_URL}/api/admin/branch/list`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      
      
      
      setBranches(res.data.branches || []);
    } catch (err) {
      errorToast("Failed to load branches", "error");
    } 
  };

  useEffect(() => {
  fetchBranches();
}, []);


useEffect(() => {
  if (!branchId || branches.length === 0) return;

  const selected = branches.find(b => b._id === branchId);

  if (selected) {
    setLabDetails({
      name: selected.branchName,
      address: selected.address || selected.fullAddress || ""
    });
  }

}, [branchId, branches]);

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

      // 🚫 Skip DOCUMENT tests (do not show in enter results)
      if (test.type === "document") {
        return null; // completely ignore
      }


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
            name: param.name
              ?.replace(/\u00A0/g, " ")
              .replace(/\s+/g, " ")
              .trim(),

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

          // 🔹 Fetch the child test only ONCE
          const childRes = await axios.get(
            `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${childId}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );

          if (!childRes.data.success) continue;

          const childTest = childRes.data.data;

          // 🚫 Skip DOCUMENT type tests
          if (childTest.type === "document") {
            console.log("⏭️ Skipping DOCUMENT test:", childTest.name);
            continue;
          }

          // 🔹 Fetch reference ranges
          const refs = await fetchRefRanges(childTest);

          // 🔹 Build processed params for result entry
          const params = processTest(childTest, refs, reportData);

          // 🔹 Push test to final array
          allTests.push({
            _id: childTest._id,          // ⭐ IMPORTANT – KEEP ORIGINAL TEST ID
            testName: childTest.name
              ?.replace(/\u00A0/g, " ")
              .replace(/\s+/g, " ")
              .trim(),

            category: childTest.category || test.category || "Other",
            interpretation: childTest.interpretation || "",
            params,
            isFormula: childTest.isFormula || false,
          });

        }
      }
      else {
        const refs = await fetchRefRanges(test);
        const params = processTest(test, refs, reportData); // ✅ pass reportData
        allTests.push({
          _id: test._id,               // ⭐ IMPORTANT
          testName: test.name
            ?.replace(/\u00A0/g, " ")
            .replace(/\s+/g, " ")
            .trim(),

          category: test.category || "Other",
          interpretation: test.interpretation || "",
          params,
          isFormula: test.isFormula || false,
        });

      }

      // ✅ Attach formula details if applicable
      // ✅ attach formula to every test inside allTests
      for (const t of allTests) {
  if (t.isFormula) {
    const { formulaString, dependencies } = await fetchFormula(t._id);
    t.formulaString = formulaString;

    // 🔥 Normalize and attach correct paramId for every dependency
    t.dependencies = dependencies.map(dep => {
      const depClean = dep.testName
        ?.replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Find the target test inside allTests
      const matchTest = allTests.find(tt => {
        const tn = tt.testName
          ?.replace(/\u00A0/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        return tn === depClean;
      });

      // Extract paramId from FIRST param (since formula tests output single param)
      const matchParam = matchTest?.params?.[0];

      return {
        ...dep,
        testName: depClean,
        shortName: matchTest?.shortName || dep.shortName || "",
        paramId: matchParam?.paramId ?? null // 🔥 NOW NEVER NULL IF PARAM EXISTS
      };
    });
  }
}






      return allTests;
    } catch (err) {
      console.error("Error fetching test:", err);
      return null;
    }
  };

  /* ----------------------------- 🔹 Fetch Report ----------------------------- */
  useEffect(() => {
    const loadEditData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch CASE
        const caseRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        const reportData = caseRes.data.data;
        setReport(reportData);

        // 2️⃣ Fetch SAVED RESULTS
        const resultRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/results/admin/report/${reportId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        const savedData = resultRes.data?.data || {};
        const savedValues = {};
        const savedRefs = {};

        // Flatten saved results → { paramId: value }
        savedData.categories?.forEach(cat => {
          cat.items?.forEach(item => {
            const tList = item.tests || [item];
            tList.forEach(t => {
              t.params?.forEach(p => {
                savedValues[p.paramId] = p.value;
                savedRefs[p.paramId] = p.reference;
              });
            });
          });
        });

        // 3️⃣ Build full test structure using same ENTER RESULTS LOGIC
        const allIds = [
          ...(reportData.tests?.LAB || []),
          ...(reportData.tests?.PANELS || []),
          ...(reportData.tests?.PACKAGES || []),
        ];

        // 3 pillars result
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
              if (panelRes.data.success && panelRes.data.data)
                return { type: "PANEL", data: panelRes.data.data };
            } catch { }

            // Try as PACKAGE
            try {
              const pkgRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/packages/admin/package/${safeId}`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
              );
              if (pkgRes.data.success && pkgRes.data.data)
                return { type: "PACKAGE", data: pkgRes.data.data };
            } catch { }

            return null;
          })
        );

        const validItems = fetchedItems.filter(Boolean);
        const categories = {};
        const initialResults = {};
        const initialReferences = {};

        // 4️⃣ Process fetched TEST / PANEL / PACKAGE
        for (const item of validItems) {

          /* ---------------- TEST ---------------- */
          if (item.type === "TEST") {
            const testList = Array.isArray(item.data) ? item.data : [item.data];

            for (const t of testList) {
              const cat = t.category || "Other";

              if (!categories[cat]) categories[cat] = [];

              t.params = t.params.map(p => {
                const key = p.name?.trim();
                return {
                  ...p,
                  value: initialResults[key] ?? "",
                  reference: initialReferences[p.paramId] ?? p.reference ?? "-",
                };
              });


              t.params?.forEach(p => {
                const key = p.name?.trim();     // store using testName key

                if (key) {
                  initialResults[key] = savedValues[p.paramId] ?? "";
                }

                initialReferences[p.paramId] = savedRefs[p.paramId] ?? p.reference ?? "-";
              });

              categories[cat].push(t);
            }
          }

          /* ---------------- PANEL ---------------- */
          if (item.type === "PANEL") {
            const panel = item.data;
            const panelObj = {
              panelName: panel.name,
              isPanel: true,
              interpretation: panel.interpretation,
              tests: []
            };

            for (let testItem of panel.tests) {
              const testId = extractId(testItem);
              const tests = await fetchTestWithRefs(testId, reportData, adminToken);
              if (tests) panelObj.tests.push(...tests);
            }

            // merge values for nested tests
            panelObj.tests.forEach(t => {
              t.params = t.params.map(p => {
                const key = p.name?.trim();
                return {
                  ...p,
                  value: initialResults[key] ?? "",
                  reference: initialReferences[p.paramId] ?? p.reference ?? "-",
                };
              });


              t.params?.forEach(p => {
                const key = p.name?.trim();     // store using testName key

                if (key) {
                  initialResults[key] = savedValues[p.paramId] ?? "";
                }

                initialReferences[p.paramId] = savedRefs[p.paramId] ?? p.reference ?? "-";
              });
            });

            const cat = panel.category || "Other";
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(panelObj);
          }

          /* ---------------- PACKAGE ---------------- */
          if (item.type === "PACKAGE") {
            const pkg = item.data;
            const pkgObj = {
              packageName: pkg.name,
              isPackage: true,
              interpretation: pkg.interpretation,
              tests: []
            };

            // Load tests inside package
            for (let testItem of pkg.tests) {
              const testId = extractId(testItem);
              const tests = await fetchTestWithRefs(testId, reportData, adminToken);
              if (tests) pkgObj.tests.push(...tests);
            }

            // Load panels inside package
            for (let panelItem of pkg.panels) {
              const panelId = extractId(panelItem);
              const panelRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/test/panels/admin/panel/${panelId}`,
                { headers: { Authorization: `Bearer ${adminToken}` } }
              );
              if (panelRes.data.success && panelRes.data.data) {
                const panel = panelRes.data.data;
                const panelObj = { panelName: panel.name, isPanel: true, tests: [] };

                for (let testItem of panel.tests) {
                  const testId = extractId(testItem);
                  const tests = await fetchTestWithRefs(testId, reportData, adminToken);
                  if (tests) panelObj.tests.push(...tests);
                }

                pkgObj.tests.push(panelObj);
              }
            }

            // merge values
            pkgObj.tests.forEach(t => {
              if (t.params) {
                t.params = t.params.map(p => {
                  const key = p.name?.trim();
                  return {
                    ...p,
                    value: initialResults[key] ?? "",
                    reference: initialReferences[p.paramId] ?? p.reference ?? "-",
                  };
                });

              }

              t.params?.forEach(p => {
                const key = p.name?.trim();     // store using testName key

                if (key) {
                  initialResults[key] = savedValues[p.paramId] ?? "";
                }

                initialReferences[p.paramId] = savedRefs[p.paramId] ?? p.reference ?? "-";
              });

            });

            if (!categories["Packages"]) categories["Packages"] = [];
            categories["Packages"].push(pkgObj);
          }
        }

        // 5️⃣ Store to State
        setTestsByCategory(categories);
        setResults(initialResults);
        setReferences(initialReferences);

      } catch (err) {
        console.error(err);
        errorToast("Failed to load edit result");
      } finally {
        setLoading(false);
      }
    };

    loadEditData();
  }, [reportId]);

  useEffect(() => {
  if (!loading && report && location.state?.autoSignOff) {
    console.log("🔥 Auto Sign Off triggered AFTER data loaded");
    handleSubmit("Signed Off");
  }
}, [loading, report, location.state]);



  /* ----------------------------- 🔹 Input Handler ----------------------------- */


  const handleChange = async (testName, value) => {
    const cleanName = testName
      .replace(/\u00A0/g, " ")
      .replace(/\s+/g, " ")
      .trim();


    console.log("⚡ handleChange:", cleanName, "=", value);

    // 1️⃣ Update results immediately for smooth typing
    const updatedResults = {
      ...results,
      [cleanName]: value
    };
    setResults(updatedResults);

    // 2️⃣ Flatten ALL tests (normal + panels + packages)
    const allTests = [];
    Object.values(testsByCategory || {}).forEach(catItems => {
      catItems.forEach(item => {
        if (item.isPanel || item.isPackage) {
          item.tests?.forEach(t => allTests.push(t));
        } else {
          allTests.push(item);
        }
      });
    });

    // 3️⃣ Loop through ALL tests & find formula tests
    for (const test of allTests) {
      if (!test.isFormula) continue;

      const formulaTestName = test.testName
        ?.replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .trim();


      // 4️⃣ Fetch formula if missing
      if (!test.formulaString || !Array.isArray(test.dependencies)) {
        try {
          const { formulaString, dependencies } = await fetchFormula(test._id);
          test.formulaString = formulaString;
          test.dependencies = dependencies;
        } catch (err) {
          console.error("❌ Formula fetch failed:", err);
          continue;
        }
      }

      console.log(
        "🔥 DEPENDENCIES FOR",
        formulaTestName,
        JSON.stringify(test.dependencies, null, 2)
      );

      // 5️⃣ Ensure dependencies exist in updated results
      const depsReady = test.dependencies.every(dep => {
        const depName = normalize(dep.testName)


        return (
          depName &&
          updatedResults[depName] !== undefined &&
          updatedResults[depName] !== ""
        );
      });

      if (!depsReady) continue;

      // 6️⃣ Calculate formula result
      try {
        const result = calculateFormulaResult(
          test.formulaString,
          test.dependencies,
          updatedResults
        );

        if (result !== null && !isNaN(result)) {
          updatedResults[formulaTestName] = Number(result.toFixed(2));
          console.log(`✅ Formula Calculated → ${formulaTestName} = ${result}`);
        }
      } catch (err) {
        console.error(`❌ Error calculating ${formulaTestName}:`, err);
      }
    }

    // 7️⃣ Clean out any unwanted MongoIDs
    const cleanedResults = {};
    Object.keys(updatedResults).forEach(key => {
      if (!/^[0-9a-f]{24}$/i.test(key)) {
        cleanedResults[key.trim()] = updatedResults[key];
      }
    });

    // 8️⃣ Final update
    setResults(cleanedResults);

    console.log("🧾 FINAL CLEAN RESULTS:", cleanedResults);
  };

  const autoGeneratePDFFull = async () => {
  try {
    console.log("⚡ Auto PDF generation started...");

    /* ---------------------------------------------------
       0️⃣ CHECK IF PDF EXISTS → IF YES, DELETE IT
    ----------------------------------------------------*/
    try {
      const existingPdf = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/pdf/get/${reportId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (existingPdf.data?.success && existingPdf.data?.data) {
        console.log("🗑️ Existing PDF found → deleting...");

        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/pdf/delete/${reportId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log("✅ Old PDF deleted");
      } else {
        console.log("ℹ️ No existing PDF found, generating new...");
      }
    } catch (e) {
      console.log("⚠️ PDF fetch failed OR no PDF exists, continuing...");
      // Continue even if error — do NOT stop generation
    }

    /* ---------------------------------------------------
       1️⃣ FETCH REPORT
    ----------------------------------------------------*/
    const reportRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/cases/admin/${reportId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (!reportRes.data.success) {
      console.error("❌ Report fetch failed");
      return;
    }

    let reportData = reportRes.data.data;

    /* ---------------------------------------------------
       2️⃣ FETCH RESULTS
    ----------------------------------------------------*/
    const resultsRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/results/admin/report/${reportId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (resultsRes.data?.success && resultsRes.data?.data) {
      reportData = { ...reportData, ...resultsRes.data.data };
    }

    /* ---------------------------------------------------
       3️⃣ FETCH LETTERHEAD
    ----------------------------------------------------*/
    const lhRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/report/letterhead/branch/${branchId}`
    );
    const letterheadData = lhRes.data?.data || null;

    /* ---------------------------------------------------
       4️⃣ FETCH SIGNATURES
    ----------------------------------------------------*/
    const sigRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/report/signature/branch/${branchId}`
    );
    const signatureData = sigRes.data?.data || [];

    /* ---------------------------------------------------
       5️⃣ FETCH PRINT SETTINGS
    ----------------------------------------------------*/
    const psRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/print/${branchId}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const printSettingData = psRes.data?.data || {};

    /* ---------------------------------------------------
       6️⃣ GENERATE NEW PDF
    ----------------------------------------------------*/
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/pdf/add`,
      {
        reportId,
        branchId,
        reportData,
        patient: reportData.patient,
        letterhead: letterheadData,
        signatures: signatureData,
        printSetting: printSettingData,
        lab: labDetails,
      },
      { headers: { Authorization: `Bearer ${branchToken}` } }
    );

    console.log("✅ New PDF generated successfully!");

  } catch (err) {
    console.error("❌ Auto PDF generation failed:", err);
  }
};



  /* ----------------------------- 🔹 Submit ----------------------------- */
  const handleSubmit = async (status) => {
    if (!report) return errorToast("Patient details missing");
    if (!selectedBranch) {
      errorToast("Please select branch to submit the report");
      return
    }

    try {
      setLoading(true);

      // 🧩 Build categories from previously fetched resultStructure
      const categories = Object.entries(testsByCategory).map(
  ([categoryName, items]) => ({
    categoryName,
    items: items.map((item) => {
      // 🟢 CASE 1: Panel or Package
      if (item.isPanel || item.isPackage) {
        return {
          panelOrPackageName: item.panelName || item.packageName || "",
          isPanel: item.isPanel || false,
          isPackage: item.isPackage || false,
          interpretation: item.interpretation || "",
          tests: item.tests.map((test) => ({
            testName: test.testName,
            interpretation: test.interpretation || "",
            category: categoryName,
            params: (test.params || []).map((p) => ({
              paramId: p.paramId,
              name: p.name,
              unit: p.unit,
              groupBy: p.groupBy || "Ungrouped",
              value:
                results[p.name?.trim()] ??
                p.value ??
                "",
              reference: references[p.paramId] ?? p.reference ?? "",
            })),
          })),
        };
      }

      // 🟢 CASE 2: Simple Test
      return {
        testName: item.testName,
        interpretation: item.interpretation || "",
        category: categoryName,
        params: (item.params || []).map((p) => ({
          paramId: p.paramId,
          name: p.name,
          unit: p.unit,
          groupBy: p.groupBy || "Ungrouped",
          value:
            results[p.name?.trim()] ??
            p.value ??
            "",
          reference: references[p.paramId] ?? p.reference ?? "",
        })),
      };
    }),
  })
);


      const payload = {
        reportId,
        status,
        patient: { ...report.patient, regNo: report.regNo },
        categories,
      };

      console.log("🧾 Payload being sent to backend:", payload);

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/results/admin/update/${reportId}`,
        payload,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

       if (res.data.success) {
  successToast("Report updated Successfully");

  if (status === "Signed Off") {
    autoGeneratePDFFull();   // 🔥 FULL BACKGROUND PDF GENERATION
  }

  navigate(`/admin/view-report/${reportId}`);
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

  const menuRef = useRef(null);


  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);   // 🔥 Close menu
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [showBar, setShowBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY) {
        // scrolling DOWN → hide
        setShowBar(false);
      } else {
        // scrolling UP → show
        setShowBar(true);
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);




  /* ----------------------------- 🔹 UI ----------------------------- */
  if (loading) return <Loader text="Processing" />;
  if (!report) return <p className="p-6 text-gray-500">Report not found</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* Header */}
      <PatientHeader report={report} />

      {/* Group tests by category */}
      {Object.entries(testsByCategory).map(([categoryName, tests], cIdx) => (
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

      <div
        className={`fixed bottom-0 left-[225px] right-0 
              bg-white border-t border-gray-300 shadow-lg z-50
              transition-transform duration-300
              ${showBar ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="w-full max-w-[1200px] mx-auto px-4 py-3 
                  flex items-start justify-start gap-3">

          {/* SIGN OFF GROUP */}
          <div ref={menuRef} className="relative flex">

            <button
              onClick={() => handleSubmit("Signed Off")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white
                   px-5 h-10 rounded-l-md shadow transition border-r border-white"
            >
              <img src="/signature-w.png" className="w-4 h-4" />
              <span className="font-medium">Sign off</span>
            </button>

            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 
                   flex items-center justify-center rounded-r-md shadow transition"
            >
              <img src="/down-arrow-w.png" className="w-3 h-3 opacity-80" />
            </button>

            {openMenu && (
              <div className="absolute right-0 bottom-12 w-48 bg-white rounded-md shadow-lg border border-gray-300">

                <div className="absolute -bottom-2 right-4 w-3 h-3 bg-white 
                          rotate-45 border-l border-b"></div>

                <ul className="py-2 text-sm">
                  <li
                    onClick={() => navigate(`/admin/bill/${reportId}`)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
                  >
                    <img src="/eye.png" className="w-4 h-4" /> View bill
                  </li>

                  <li
                    onClick={() => navigate(`/admin/edit-case/${reportId}`)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex gap-2 items-center"
                  >
                    <img src="/edit.png" className="w-4 h-4" /> Modify case
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* FINAL BUTTON */}
          <button
  id="finalSubmitButton"
  onClick={() => handleSubmit("Final")}
  className="flex items-center gap-2 border border-gray-300 text-gray-700 
       px-5 h-10 rounded-md hover:bg-gray-100 transition"
>
  <img src="/check.png" className="w-4 h-4" />
  <span className="font-medium">Final</span>
</button>


          {/* SAVE ONLY BUTTON */}
          <button
            onClick={() => handleSubmit("In Progress")}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 
                 px-5 h-10 rounded-md hover:bg-gray-100 transition"
          >
            <img src="/save.png" className="w-4 h-4" />
            <span className="font-medium">Save only</span>
          </button>

        </div>
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


const TestRow = ({ item, results, references, handleChange, handleReferenceChange }) => {
  const params = Array.isArray(item.params) ? item.params : [];
  const groups = [...new Set(params.map((p) => p.groupBy || "Ungrouped"))];

  const storageKey = `remarks_${item._id}`;
  const [remarks, setRemarks] = useState([]);
  const [showRemarkInput, setShowRemarkInput] = useState(false);
  const [newRemark, setNewRemark] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setRemarks(saved);
  }, [storageKey]);



  // Detect DLC test
  const isDLC = item.testName?.trim().toLowerCase() === "differential leucocyte count";

  // DLC Total Calculation
  let dlcTotal = 0;
  if (isDLC) {
    dlcTotal = params.reduce((sum, p) => {
      const val = parseFloat(results[p.name?.trim()] || 0);


      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }

  // Check if value is out of reference range
  const checkOutOfRange = (value, reference) => {
    if (!value || !reference) return null;

    const match = reference.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (!match) return null;

    const [, min, max] = match;
    const numVal = parseFloat(value);

    if (numVal < parseFloat(min)) return { type: "low", min, max };
    if (numVal > parseFloat(max)) return { type: "high", min, max };

    return null;
  };

  const getSeverityMultiplier = (value, refValue) => {
    const num = parseFloat(value);
    const ref = parseFloat(refValue);
    if (!num || !ref || ref === 0) return 1;
    return Number((num / ref).toFixed(1));
  };

  return (
    <div className="mt-4 px-6">

      {/* Test name + formula icon */}
      <div className="flex items-center gap-2 mb-2">
        {params.length > 1 && (
          <div className="font-semibold text-gray-800">
            ✶ {item.testName}
          </div>
        )}


      </div>

      {/* GROUPS */}
      {groups.map((group) => (
        <div key={group} className="mb-4">
          {group && (
            <div className="font-semibold text-gray-700 mb-1 ml-7">{group}</div>
          )}

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
              {params
                .filter((p) => (p.groupBy || "Ungrouped") === group)
                .map((param) => {
                  const testNameKey = param.name?.trim();
                  const value = results[param.name?.trim()] || "";


                  const reference = references[param.paramId] || "";
                  const check = checkOutOfRange(value, reference);

                  let textStyle = "border-gray-300 text-black";
                  let marker = "";
                  let tooltip = "";

                  if (check) {
                    textStyle = "border-red-500 font-bold text-red-600";

                    if (check.type === "high") {
                      marker = "H ↑";
                      const multiplier = getSeverityMultiplier(value, check.max);
                      tooltip = `${value} is ${multiplier} times higher than ${check.max}. Please verify.`;
                    } else if (check.type === "low") {
                      marker = "L ↓";
                      tooltip = `${value} is lower than ${check.min}. Please verify.`;
                    }
                  }

                  return (
                    <tr key={param.paramId} className="border-t hover:bg-gray-50">

                      {/* Param Name + High/Low marker */}
                      <td className="px-4 py-2 flex items-center gap-2">
                        {marker && (
                          <span className="text-red-600 font-bold text-xs">{marker}</span>
                        )}

                        {param.name}

                        {/* Formula Icon + Tooltip */}
                        {item.isFormula && item.formulaString && (
                          <div className="relative group inline-flex items-center">
                            <span className="text-blue-600 font-bold cursor-pointer border border-blue-500 px-1 rounded text-xs flex items-center justify-center">
                              ƒ
                            </span>

                            {/* Tooltip */}
                            <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg">
                              Formula: {item.formulaString}
                              <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-800"></div>
                            </div>
                          </div>
                        )}
                      </td>


                      {/* Value Input */}
                      <td className="px-3 py-2 relative ">

                        <div className="flex items-center gap-2 w-full">


                          <button
                            onClick={() => setShowRemarkInput(true)}
                            className="ml-2 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                          >
                            +
                          </button>

                          {showRemarkInput && (
                            <div className="flex items-center gap-2 mt-2 ml-7">
                              <input
                                type="text"
                                placeholder="Enter remark"
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                className="border px-2 py-1 rounded w-60"
                              />

                              <button
                                onClick={() => {
                                  if (!newRemark.trim()) return;
                                  const updated = [...remarks, newRemark.trim()];
                                  setRemarks(updated);
                                  localStorage.setItem(storageKey, JSON.stringify(updated));
                                  setNewRemark("");
                                  setShowRemarkInput(false);
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded"
                              >
                                Save
                              </button>

                              <button
                                onClick={() => setShowRemarkInput(false)}
                                className="px-3 py-1 bg-gray-300 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          )}




                          <input
                            type="text"
                            value={value}
                            onChange={(e) => handleChange(param.name
                              ?.replace(/\u00A0/g, " ")
                              .replace(/\s+/g, " ")
                              .trim(), e.target.value)}
                            className={`w-full rounded px-2 py-1 ${textStyle} 
  ${item.isFormula ? "border border-amber-500" : "border border-gray-400"} 
  focus:ring-1 outline-none`}

                          />

                          {/* REMARK DROPDOWN (appears when clicking input) */}
                          {remarks.length > 0 && (
                            <select
                              onChange={(e) => handleChange(param.name
                                ?.replace(/\u00A0/g, " ")
                                .replace(/\s+/g, " ")
                                .trim(), e.target.value)}
                              className="absolute right-0 top-0 h-full bg-transparent  outline-none text-gray-500 cursor-pointer px-2"
                            >
                              <option value=""></option>
                              {remarks.map((r, i) => (
                                <option key={i} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* EXISTING TOOLTIP (keep this) */}
                          {check && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 group cursor-pointer mr-2">
                              <TriangleAlert className="text-red-600 w-4 h-4" />
                              <div className="hidden group-hover:block absolute right-6 top-1/2 -translate-y-1/2 bg-white border border-red-500 text-red-500 text-xs p-2 rounded shadow-lg w-[200px] font-bold">
                                {tooltip}
                              </div>
                            </div>
                          )}


                        </div>
                      </td>

                      <td className="px-3 py-2 text-gray-600">{param.unit}</td>

                      {/* Reference */}
                      <td className="px-3 py-2 text-gray-600">
                        <input
                          type="text"
                          value={reference}
                          disabled
                          className="w-full border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>

          {/* DLC Total */}
          {isDLC && (
            <div className="mt-3 px-2">
              <div className={`font-semibold text-sm ${dlcTotal === 100 ? "text-green-600" : "text-red-600"}`}>
                Total: {dlcTotal}
              </div>
              {dlcTotal !== 100 && (
                <div className="text-xs text-red-500 mt-1">
                  ⚠ Total must be exactly 100.
                </div>
              )}
            </div>
          )}

          {/* Interpretation */}
          {item.interpretation && (
            <div className="mt-3 mb-2 px-2">
              <div className="font-semibold text-gray-800 text-sm">Interpretation:</div>
              <div
                className="text-gray-700 text-sm mt-1 ml-4"
                dangerouslySetInnerHTML={{ __html: item.interpretation }}
              />
            </div>
          )}

          {/* Calculated Formula Result */}
          {item.isFormula && item.calculatedResult && (
            <div className="mt-2 text-sm text-gray-600">
              <strong>Calculated Result:</strong> {item.calculatedResult}
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



export default AdminEditResult;
