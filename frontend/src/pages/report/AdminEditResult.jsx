import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";

const AdminEditResult = () => {
  const { branchId, branchToken, errorToast, successToast, selectedBranch } = useContext(LabContext);
  const { reportId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [results, setResults] = useState({});
  const [references, setReferences] = useState({});

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/results/report/${reportId}`,
          { headers: { Authorization: `Bearer ${branchToken}` } }
        );

        if (!res.data.success) throw new Error("Failed to fetch report");

        const reportData = res.data.data || {};
        setReport(reportData);

        // Prefill results and references from report.categories
        const initialResults = {};
        const initialReferences = {};

        (reportData.categories || []).forEach((cat) => {
          (cat.items || []).forEach((test) => {
            (test.params || []).forEach((p) => {
              initialResults[p.paramId] = p.value ?? "";
              initialReferences[p.paramId] = p.reference ?? "";
            });
          });
        });

        setResults(initialResults);
        setReferences(initialReferences);
      } catch (err) {
        console.error(err);
        errorToast(err.message || "Server error");
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
    if (!report) return errorToast("Patient details missing");
    try {
      setLoading(true);

      const payload = {
        reportId,
        branchId: selectedBranch,
        patient: { ...report.patient, regNo: report.regNo },
        categories: (report.categories || []).map((cat) => ({
          categoryName: cat.categoryName,
          items: (cat.items || []).map((test) => ({
            testName: test.testName,
            interpretation: test.interpretation || "",
            category: test.category || cat.categoryName,
            params: (test.params || []).map((p) => ({
              paramId: p.paramId,
              name: p.name,
              unit: p.unit,
              groupBy: p.groupBy || "Ungrouped",
              value: results[p.paramId] || "",
              reference: references[p.paramId] || p.reference || "",
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
        navigate(`/admin/view-report/${reportId}`);
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="font-bold text-2xl mb-4">Edit Results</h1>

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

      {(report.categories || []).map((cat) => (
        <div key={cat.categoryName} className="mb-10 border rounded-lg bg-white shadow-sm">
          <div className="border-b bg-gray-100 px-4 py-3 text-center font-semibold text-gray-700">
            ✶ {cat.categoryName.toUpperCase()}
          </div>
          {(cat.items || []).map((test, idx) => (
            <TestRow
              key={idx}
              item={test}
              results={results}
              references={references}
              handleChange={handleChange}
              handleReferenceChange={handleReferenceChange}
            />
          ))}
        </div>
      ))}

      <div className="text-center mt-6">
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md shadow-sm transition"
        >
          Update Report
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
              {params
                .filter((p) => (p.groupBy || "Ungrouped") === group)
                .map((param) => (
                  <tr key={param.paramId} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{param.name}</td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={results[param.paramId] ?? ""}
                        onChange={(e) => handleChange(param.paramId, e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-400 outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-600">{param.unit}</td>
                    <td className="px-3 py-2 text-gray-600">
                      <input
                        type="text"
                        value={references[param.paramId] ?? ""}
                        onChange={(e) => handleReferenceChange(param.paramId, e.target.value)}
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

export default AdminEditResult;
