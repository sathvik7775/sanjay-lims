import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { LabContext } from "../../context/LabContext";
import Loader from "../../components/Loader";
import { GripVertical, Edit3 } from "lucide-react";

const TestView = () => {
  const { id } = useParams();
  const { adminToken, errorToast, navigate } = useContext(LabContext);

  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [values, setValues] = useState({});

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        console.log(res.data);

        if (res.data.success) {
          setTest(res.data.data);
        } else {
          errorToast?.(res.data.message || "Failed to fetch test");
        }
      } catch (err) {
        console.error("Error fetching test:", err);
        errorToast?.("Failed to fetch test");
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id]);

  const handleValueChange = (paramId, value) => {
    setValues((prev) => ({ ...prev, [paramId]: value }));
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
          <tr
            key={param._id || idx}
            className="bg-white"
          >
            <td className="px-3 py-2 border-b flex items-center gap-2">
              <GripVertical className="text-gray-400" size={16} />
              {idx + 1}.
            </td>
            <td className="px-3 py-2 border-b">{param.name}</td>
            <td className="px-3 py-2 border-b">{param.isOptional ? "Yes" : "No"}</td>
            <td className="px-3 py-2 border-b">{param.unit || "-"}</td>
            <td className="px-3 py-2 border-b">
              <button onClick={() => navigate(`/admin/test-values/${test._id}`)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
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
      <h1 className="text-2xl font-bold text-black">{test.name}</h1>

      {/* Single Test */}
      {test.type === "single" && (
        <div className="space-y-2">
          <p>
            Unit: <strong>{test.unit}</strong>
          </p>
          <button onClick={() => navigate(`/admin/test-values/${test._id}`)} className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
                <Edit3 size={14} />
                Edit normal values
              </button>
          {test.isOptional && <p className="text-sm text-gray-500">Optional</p>}
        </div>
      )}

      {/* Nested Test */}
      {test.type === "nested" &&
        [...new Set((test.parameters || []).map((p) => p.groupBy || "Ungrouped"))].map(
          (group) => (
            <div key={group} className="mt-4">
              <h2 className="font-semibold">{group}</h2>
              {renderParameters((test.parameters || []).filter((p) => p.groupBy === group))}
            </div>
          )
        )}

      {/* Multi Test */}
      {test.type === "multi" && (
        <div className="mt-4">
          {renderParameters(test.parameters || [])}
        </div>
      )}

      {/* Document Test */}
      {test.type === "document" && (
        <div>
          <p className="mb-2 font-semibold">Default Result / Interpretation:</p>
          <div
            dangerouslySetInnerHTML={{ __html: test.defaultResult }}
            className="p-2 border rounded"
          />
        </div>
      )}
    </div>
  );
};

export default TestView;
