




import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import { LabContext } from "../../../context/LabContext";
import Loader from "../../../components/Loader";

const EditMultiplepara = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { errorToast, successToast, adminToken, categories } = useContext(LabContext);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        shortName: "",
        category: "",
        price: "",
        method: "",
        instrument: "",
        interpretation: "",
        parameters: [],
        isFormula: false,  // Add the isFormula field
        addToRateList: true,
    });

    // Fetch existing test
    useEffect(() => {
        const fetchTest = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/test/database/admin/test/${id}`,
                    { headers: { Authorization: `Bearer ${adminToken}` } }
                );

                if (res.data.success && res.data.data) {
                    const test = res.data.data;
                    setFormData({
                        name: test.name || "",
                        shortName: test.shortName || "",
                        category: test.category || "",
                        price: test.price || "",
                        method: test.method || "",
                        instrument: test.instrument || "",
                        interpretation: test.interpretation || "",
                        addToRateList: test.addToRateList ?? true,
                        isFormula: test.isFormula || false,

                        parameters: test.parameters?.map((p, index) => ({
                            id: index + 1,
                            order: p.order,
                            name: p.name,
                            shortName: p.shortName,
                            unit: p.unit,
                            inputType: p.inputType,
                            defaultResult: p.defaultResult,
                            isOptional: p.isOptional,
                        })) || [],
                    });
                } else {
                    errorToast?.("Failed to load test details");
                }
            } catch (err) {
                console.error("Error fetching test:", err);
                errorToast?.("Error fetching test details");
            } finally {
                setLoading(false);
            }
        };

        fetchTest();
    }, [id, adminToken]);

    // General form change handler
    const handleChange = (e) => {
  const { name, value, type, checked } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: type === "checkbox" ? checked : value,  // Handle checkbox value correctly
  }));
};


    // Parameter-specific change
    const handleParameterChange = (e, index) => {
        const { name, value, type, checked } = e.target;
        const updatedParameters = [...formData.parameters];
        updatedParameters[index][name] = type === "checkbox" ? checked : value;
        setFormData((prev) => ({ ...prev, parameters: updatedParameters }));
    };

    const handleAddParameter = () => {
        const newParam = {
            id: formData.parameters.length + 1,
            order: formData.parameters.length + 1,
            name: "",
            shortName: "",
            unit: "",
            inputType: "Single Line",
            defaultResult: "",
            isOptional: false,
        };
        setFormData((prev) => ({
            ...prev,
            parameters: [...prev.parameters, newParam],
        }));
    };

    const handleRemoveParameter = (index) => {
        const updated = formData.parameters.filter((_, i) => i !== index);
        setFormData((prev) => ({ ...prev, parameters: updated }));
    };

    // Submit updated test
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            errorToast?.("Please enter test name");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                name: formData.name,
                shortName: formData.shortName,
                type: "multi",
                category: formData.category,
                price: Number(formData.price),
                method: formData.method,
                instrument: formData.instrument,
                interpretation: formData.interpretation,
                parameters: formData.parameters.map((p) => ({
                    order: p.order,
                    name: p.name,
                    shortName: p.shortName,
                    unit: p.unit,
                    inputType: p.inputType,
                    defaultResult: p.defaultResult,
                    isOptional: p.isOptional,
                })),
                isFormula: formData.isFormula,
                addToRateList: formData.addToRateList,

            };

            const res = await axios.put(
                `${import.meta.env.VITE_API_URL}/api/test/database/admin/edit/${id}`,
                payload,
                { headers: { Authorization: `Bearer ${adminToken}` } }
            );

            if (res.data.success) {
                successToast?.("Test updated successfully!");
                navigate("/admin/test-database");
            } else {
                errorToast?.(res.data.message || "Update failed");
            }
        } catch (err) {
            console.error("Error updating test:", err);
            errorToast?.("Failed to update test");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="w-full p-8 bg-white rounded-lg shadow-lg mt-2">
            <h1 className="text-2xl font-semibold text-center mb-6">
                Edit Test (Multi Parameter)
            </h1>
            <form onSubmit={handleSubmit}>
                {/* Test Details */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-semibold">Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="shortName" className="block text-sm font-semibold">Short Name</label>
                            <input
                                type="text"
                                id="shortName"
                                name="shortName"
                                value={formData.shortName}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm mb-1">Category</label>
                            <input
                                list="categories"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                placeholder="Select category..."
                            />
                            <datalist id="categories">
                                {categories.map((cat) => (
                                    <option key={cat._id} value={cat.name} />
                                ))}
                            </datalist>
                        </div>

                        <div>
                            <label htmlFor="price" className="block text-sm font-semibold">Price</label>
                            <input
                                type="number"
                                id="price"
                                name="price"
                                value={formData.price}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Parameters */}
                <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Parameters</h2>
                    {formData.parameters.map((param, index) => (
                        <div key={param.id} className="grid grid-cols-6 gap-4 mb-4 p-4 border border-gray-200 rounded-md bg-gray-50">
                            <div className="flex items-center space-x-4">
                                <button
                                    type="button"
                                    onClick={() => handleRemoveParameter(index)}
                                    className="text-primary font-semibold hover:underline"
                                >
                                    Remove
                                </button>
                                <div>
                                    <label className="block text-sm font-semibold">Order</label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={param.order || ''}
                                        onChange={(e) => handleParameterChange(e, index)}
                                        className="w-16 p-2 border border-gray-300 rounded-md"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={param.name}
                                    onChange={(e) => handleParameterChange(e, index)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Unit</label>
                                <input
                                    list="units"
                                    name="unit"
                                    value={param.unit}
                                    onChange={(e) => handleParameterChange(e, index)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Select unit..."
                                />
                                <datalist id="units">
                                    <option value="%" />
                                    <option value="AU/mL" />
                                    <option value="cumm" />
                                    <option value="fL" />
                                    <option value="FL" />
                                    <option value="g" />
                                    <option value="g/dl" />
                                    <option value="gm%" />
                                    <option value="/HPF" />
                                    <option value="index/mL" />
                                    <option value="IU/L" />
                                    <option value="µIU/mL" />
                                    <option value="IU/mL" />
                                    <option value="lakhs/cumm" />
                                    <option value="mcg/mg" />
                                    <option value="mcL" />
                                    <option value="mEq/L" />
                                    <option value="mg%" />
                                    <option value="mg/dl" />
                                    <option value="mg/DL" />
                                    <option value="mg/L" />
                                    <option value="mg/mL" />
                                    <option value="Mill/cml." />
                                    <option value="million/cumm" />
                                    <option value="min" />
                                    <option value="mIU/mL" />
                                    <option value="ml" />
                                    <option value="mm for 1st hour" />
                                    <option value="mmHg" />
                                    <option value="mmol/l" />
                                    <option value="mmol/L" />
                                    <option value="ng/dl" />
                                    <option value="ng/I" />
                                    <option value="ng/mL" />
                                    <option value="nmol/L" />
                                    <option value="Pg" />
                                    <option value="pg/d" />
                                    <option value="pg/ml" />
                                    <option value="pg/mL" />
                                    <option value="pmol/L" />
                                    <option value="seconds" />
                                    <option value="Thousand/cumm" />
                                    <option value="U/I" />
                                    <option value="U/mL" />
                                    <option value="x10^9/L" />
                                    <option value="μg/24 hrs" />
                                    <option value="μg/dl" />
                                    <option value="μg FEU/mL" />
                                    <option value="μg/mL" />
                                </datalist>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold">Input Type</label>
                                <select
                                    name="inputType"
                                    value={param.inputType}
                                    onChange={(e) => handleParameterChange(e, index)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                >
                                    <option value="Single Line">Single Line</option>
                                    <option value="Numeric">Numeric</option>
                                    <option value="Paragraph">Paragraph</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold">Default Result</label>
                                <input
                                    type="text"
                                    name="defaultResult"
                                    value={param.defaultResult}
                                    onChange={(e) => handleParameterChange(e, index)}
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isOptional"
                                    checked={param.isOptional}
                                    onChange={(e) => handleParameterChange(e, index)}
                                    className="mr-2"
                                />
                                <label className="text-sm">Optional</label>
                            </div>

                            <div className="flex items-center mt-4">
                                <input
                                    type="checkbox"
                                    name="isFormula"
                                    checked={formData.isFormula}  // Bind to the formData state
                                    onChange={handleChange}  // Handle checkbox change
                                    className="mr-2"
                                />
                                <label className="text-sm">Is this a formula test?</label>
                            </div>
                            <div className="flex items-center mt-2">
    <input
        type="checkbox"
        name="addToRateList"
        checked={formData.addToRateList}
        onChange={handleChange}
        className="mr-2"
    />
    <label className="text-sm">Add to Rate List</label>
</div>


                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={handleAddParameter}
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                    >
                        + Add more parameters
                    </button>
                </div>

                {/* Method & Instrument */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                        <label htmlFor="method" className="block text-sm font-semibold">Method</label>
                        <input
                            type="text"
                            id="method"
                            name="method"
                            value={formData.method}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label htmlFor="instrument" className="block text-sm font-semibold">Instrument</label>
                        <input
                            type="text"
                            id="instrument"
                            name="instrument"
                            value={formData.instrument}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>

                {/* Interpretation */}
                <div className="mt-4">
                    <label className="block text-sm font-medium mb-1">Interpretation</label>
                    <Editor
                        apiKey="0vfv6vlb9kccql8v3on0qtobc8m7irv267colygcsartuoxa"
                        value={formData.interpretation}
                        init={{
                            height: 250,
                            menubar: false,
                            plugins: [
                                "advlist", "autolink", "lists", "link", "image", "charmap",
                                "preview", "anchor", "searchreplace", "visualblocks", "code",
                                "fullscreen", "insertdatetime", "media", "table", "help", "wordcount"
                            ],
                            toolbar:
                                "undo redo | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | link image | code",
                            content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px; }",
                            branding: false,
                        }}
                        onEditorChange={(content) =>
                            setFormData((prev) => ({ ...prev, interpretation: content }))
                        }
                    />
                </div>

                {/* Save Button */}
                <div className="text-center mt-6">
                    <button
                        type="submit"
                        className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditMultiplepara;
