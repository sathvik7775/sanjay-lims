import React, { useState, useEffect, useContext } from "react";
import { Pencil, ChevronDown, ChevronRight } from "lucide-react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { LabContext } from "../context/LabContext";

export default function EditValues() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState(null);
  const [ranges, setRanges] = useState({});
  const [openParamId, setOpenParamId] = useState(null);
  const { adminToken, successToast, errorToast } = useContext(LabContext);

  const defaultNumericRange = {
    sex: "Any",
    minAge: 0,
    minUnit: "Years",
    maxAge: 0,
    maxUnit: "Years",
    lower: "",
    upper: "",
    displayText: "",
  };

  // Fetch test info
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data.success) {
          const data = res.data.data;
          setTest(data);

          const initRanges = {};
          const params =
            data.parameters?.length > 0
              ? data.parameters
              : [{ _id: data._id, name: data.name }];

          params.forEach((param) => {
            initRanges[param._id] = {
              type: "Numeric",
              data: [{ ...defaultNumericRange }],
              exists: false,
            };
          });

          setRanges(initRanges);
        } else {
          errorToast?.(res.data.message || "Failed to fetch test");
        }
      } catch (err) {
        console.error(err);
        errorToast?.("Failed to fetch test");
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  // Fetch existing reference ranges
  useEffect(() => {
    if (!test) return;

    const fetchRanges = async (paramId) => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/test/database/reference-ranges/test/${paramId}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );

        if (res.data?.data?.length) {
          const isText = res.data.data[0].which === "Text";
          setRanges((prev) => ({
            ...prev,
            [paramId]: {
              type: isText ? "Text" : "Numeric",
              data: res.data.data.map((r) =>
                isText
                  ? {
                      textValue: r.textValue || "",
                      displayText: r.displayText || r.textValue || "-",
                    }
                  : {
                      sex: r.sex || "Any",
                      minAge: r.minAge || 0,
                      minUnit: r.minUnit || "Years",
                      maxAge: r.maxAge || 0,
                      maxUnit: r.maxUnit || "Years",
                      lower: r.lower ?? "",
                      upper: r.upper ?? "",
                      displayText: r.displayText || "",
                    }
              ),
              exists: true,
            },
          }));
        }
      } catch (err) {
        console.error(err);
        errorToast?.("Failed to fetch ranges");
      }
    };

    const params =
      test.parameters?.length > 0 ? test.parameters : [{ _id: test._id }];
    params.forEach((param) => fetchRanges(param._id));
  }, [test]);

  const handleChange = (paramId, index, field, value) => {
    setRanges((prev) => {
      const param = prev[paramId];
      const updatedData = [...(param?.data || [])];
      updatedData[index] = { ...updatedData[index], [field]: value };
      return { ...prev, [paramId]: { ...param, data: updatedData } };
    });
  };

  const handleAdd = (paramId) => {
    setRanges((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        data: [...(prev[paramId].data || []), { ...defaultNumericRange }],
      },
    }));
  };

  const handleSubmit = async (paramId) => {
    try {
      const param = test.parameters?.find((p) => p._id === paramId);
      const paramObj = ranges[paramId];

      if (!paramObj || !paramObj.data?.length) {
        errorToast("No ranges to submit");
        return;
      }

      const payload = {
        testId: test._id,
        testName: test.name,
        parameterId: param?._id || null,
        parameterName: param?.name || null,
        ranges: paramObj.data.map((r) => ({
          sex: r.sex || "Any",
          type: paramObj.type || "Numeric",
          minAge: Number(r.minAge) || 0,
          minUnit: r.minUnit || "Years",
          maxAge: Number(r.maxAge) || 0,
          maxUnit: r.maxUnit || "Years",
          lower: paramObj.type === "Numeric" ? Number(r.lower) || 0 : null,
          upper: paramObj.type === "Numeric" ? Number(r.upper) || 0 : null,
          textValue: paramObj.type === "Text" ? r.textValue || "" : null,
          displayText: r.displayText?.trim()
            ? r.displayText.trim()
            : paramObj.type === "Text"
            ? r.textValue || "-"
            : "-",
        })),
      };

      if (paramObj.exists) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/test/database/reference-ranges`,
          payload,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        successToast("Ranges updated successfully!");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/test/database/reference-ranges/add`,
          payload,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        successToast("Ranges saved successfully!");
      }

      setRanges((prev) => ({
        ...prev,
        [paramId]: { ...prev[paramId], exists: true },
      }));
    } catch (err) {
      console.error(err.response?.data || err);
      errorToast("Failed to save/update ranges");
    }
  };

  const toggleOpen = (paramId) =>
    setOpenParamId((prev) => (prev === paramId ? null : paramId));

  if (loading) return <div>Loading...</div>;
  if (!test) return <div>No test found</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm space-y-6 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4">
        {test.name} - Normal Values
      </h2>

      {(test.parameters?.length
        ? test.parameters
        : [{ _id: test._id, name: test.name }]
      ).map((param) => {
        const isOpen = openParamId === param._id;
        const paramRange =
          ranges[param._id] || {
            type: "Numeric",
            data: [{ ...defaultNumericRange }],
            exists: false,
          };

        return (
          <div
            key={param._id}
            className="border rounded-md overflow-hidden transition-all"
          >
            <button
              onClick={() => toggleOpen(param._id)}
              className="flex items-center justify-between w-full text-left px-4 py-3 bg-gray-100 hover:bg-gray-200"
            >
              <span className="font-medium text-gray-700 flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                {param.name}
              </span>
            </button>

            {isOpen && (
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <label className="font-medium text-gray-700">
                    Section Type:
                  </label>
                  <select
                    value={paramRange.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setRanges((prev) => ({
                        ...prev,
                        [param._id]: {
                          type: newType,
                          data:
                            newType === "Numeric"
                              ? [{ ...defaultNumericRange }]
                              : [{ textValue: "" }],
                          exists: paramRange.exists,
                        },
                      }));
                    }}
                    className="border rounded-md p-2"
                  >
                    <option value="Numeric">Numeric</option>
                    <option value="Text">Text</option>
                  </select>
                </div>

                {/* Numeric Section */}
                {paramRange.type === "Numeric" ? (
                  <>
                    <div className="grid grid-cols-7 gap-2 text-sm font-medium text-gray-700 mb-2">
                      <div></div>
                      <div>Sex</div>
                      <div>Min. age</div>
                      <div>Max. age</div>
                      <div>Lower</div>
                      <div>Upper</div>
                      <div>Displayed in report</div>
                    </div>

                    {paramRange.data.map((range, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-7 gap-2 items-center border border-gray-200 bg-gray-50 p-2 rounded-md"
                      >
                        <button
                          onClick={() =>
                            setRanges((prev) => ({
                              ...prev,
                              [param._id]: {
                                ...prev[param._id],
                                data: prev[param._id].data.filter(
                                  (_, i) => i !== index
                                ),
                              },
                            }))
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          🗑
                        </button>

                        <select
                          value={range.sex}
                          onChange={(e) =>
                            handleChange(param._id, index, "sex", e.target.value)
                          }
                          className="border rounded-md p-1 w-full"
                        >
                          <option>Any</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>

                        <div className="flex">
                          <input
                            type="number"
                            value={range.minAge}
                            onChange={(e) =>
                              handleChange(param._id, index, "minAge", e.target.value)
                            }
                            className="border-l border-t border-b rounded-l-md p-1 w-16"
                          />
                          <select
                            value={range.minUnit}
                            onChange={(e) =>
                              handleChange(param._id, index, "minUnit", e.target.value)
                            }
                            className="border rounded-r-md p-1"
                          >
                            <option>Days</option>
                            <option>Months</option>
                            <option>Years</option>
                          </select>
                        </div>

                        <div className="flex">
                          <input
                            type="number"
                            value={range.maxAge}
                            onChange={(e) =>
                              handleChange(param._id, index, "maxAge", e.target.value)
                            }
                            className="border-l border-t border-b rounded-l-md p-1 w-16"
                          />
                          <select
                            value={range.maxUnit}
                            onChange={(e) =>
                              handleChange(param._id, index, "maxUnit", e.target.value)
                            }
                            className="border rounded-r-md p-1"
                          >
                            <option>Days</option>
                            <option>Months</option>
                            <option>Years</option>
                          </select>
                        </div>

                        <input
                          type="number"
                          value={range.lower}
                          onChange={(e) =>
                            handleChange(param._id, index, "lower", e.target.value)
                          }
                          className="border rounded-md p-1 w-full"
                        />

                        <input
                          type="number"
                          value={range.upper}
                          onChange={(e) =>
                            handleChange(param._id, index, "upper", e.target.value)
                          }
                          className="border rounded-md p-1 w-full"
                        />

                        {/* ✅ Editable Display Text */}
                        <input
                          type="text"
                          value={range.displayText || ""}
                          onChange={(e) =>
                            handleChange(param._id, index, "displayText", e.target.value)
                          }
                          placeholder="e.g. Neg. < 2 AU/mL, Grey Zone 2 - 4 AU/mL"
                          className="border rounded-md p-1 w-full"
                        />
                      </div>
                    ))}

                    <div className="flex justify-between items-center mt-3">
                      <button
                        onClick={() => handleAdd(param._id)}
                        className="flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800"
                      >
                        ➕ Add more
                      </button>
                      <button
                        onClick={() => handleSubmit(param._id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                      >
                        {paramRange.exists ? "🔄 Update" : "✅ Save"}
                      </button>
                    </div>
                  </>
                ) : (
                  // Text Section
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700">
                      Text Result
                    </label>
                    <input
                      type="text"
                      value={paramRange.data[0]?.textValue || ""}
                      onChange={(e) =>
                        setRanges((prev) => ({
                          ...prev,
                          [param._id]: {
                            ...prev[param._id],
                            data: [{ textValue: e.target.value }],
                          },
                        }))
                      }
                      placeholder="e.g. Pale yellow, Cloudy..."
                      className="border rounded-md p-2 w-full"
                    />
                    <button
                      onClick={() => handleSubmit(param._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      {paramRange.exists ? "🔄 Update" : "✅ Save"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
